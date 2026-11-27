import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { baseUrl, allowlist } from "@/lib/auth";
import { isAllowedIdentity } from "@/lib/allowlist";
import { createSession } from "@/lib/session";
import { fetchJsonWithRetry } from "@/lib/net";

// Give the two GitHub calls room to retry a transient hiccup before we give up.
export const maxDuration = 20;

// GitHub redirects back here with ?code & ?state. We verify state, exchange the
// code for an access token, fetch the user, and — only if it's the allowed
// account (matched by numeric GitHub ID, see lib/allowlist.ts) — mint a
// session and send them to /private.
export async function GET(request: Request) {
  const base = await baseUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expectedState = store.get("lt_oauth_state")?.value;
  store.delete("lt_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${base}/private/denied?reason=state`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/private/denied?reason=config`);
  }

  // 1. Exchange the code for an access token. Retry transient GitHub failures
  //    (5xx / rate-limit / timeout) instead of misreading them as a rejection.
  const token = await fetchJsonWithRetry<{ access_token?: string }>(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${base}/api/auth/callback`,
      }),
    },
    { deadlineMs: 9_000, gapMs: 800 },
  );
  if (!token?.access_token) {
    // GitHub didn't hand back a token (transient outage, or a reused/expired
    // code). Retryable — send them to try again, NOT to "not allowed".
    return NextResponse.redirect(`${base}/private/denied?reason=github`);
  }

  // 2. Fetch the GitHub user behind that token (same retry treatment).
  const user = await fetchJsonWithRetry<{ id?: number; login?: string; name?: string; avatar_url?: string }>(
    "https://api.github.com/user",
    { headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json" } },
    { deadlineMs: 9_000, gapMs: 800 },
  );
  if (!user?.login) {
    // Couldn't read the user from GitHub — a hiccup, not a wrong account.
    return NextResponse.redirect(`${base}/private/denied?reason=github`);
  }

  // 3. Allowlist check — reached only when GitHub answered cleanly, so a miss
  //    here is a genuinely different account, not a transient error.
  if (!isAllowedIdentity(user, allowlist())) {
    return NextResponse.redirect(`${base}/private/denied?reason=not_allowed`);
  }

  await createSession({ id: user.id, login: user.login, name: user.name, avatar: user.avatar_url });
  return NextResponse.redirect(`${base}/private`);
}
