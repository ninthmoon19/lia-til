import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession, type Session } from "./session";
import { allowlistFromEnv, isAllowedIdentity, type AllowlistConfig } from "./allowlist";

/** The single allowed GitHub account: by numeric ID (ALLOWED_GITHUB_ID), or by
 * login (ALLOWED_GITHUB_LOGIN) only when no ID is set. Everyone else is a public
 * visitor. See lib/allowlist.ts. */
export function allowlist(): AllowlistConfig {
  return allowlistFromEnv(process.env);
}

export function isAllowed(session: Session | null): boolean {
  // An old cookie without an `id` fails here once ALLOWED_GITHUB_ID is set, so
  // requireAdmin() sends the owner back through login, which mints a new one.
  return isAllowedIdentity(session, allowlist());
}

/** Memoized per request — the admin session, or null for a public visitor. */
export const currentAdmin = cache(async (): Promise<Session | null> => {
  const session = await getSession();
  return isAllowed(session) ? session : null;
});

/** For a protected page/handler: return the admin session or bounce to login. */
export async function requireAdmin(): Promise<Session> {
  const session = await currentAdmin();
  if (!session) redirect("/api/auth/login");
  return session;
}

/** The site's public origin, derived from the proxy headers (so the OAuth
 * redirect_uri matches whatever host served the request). */
export async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
