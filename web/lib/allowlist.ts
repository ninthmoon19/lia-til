// Who may enter /private. Pure logic, no imports on purpose: `node --test`
// runs the sibling test file against this module directly.
//
// The owner is matched by numeric GitHub user ID (ALLOWED_GITHUB_ID), which
// survives an account rename. ALLOWED_GITHUB_LOGIN is a fallback used ONLY
// when no ID is configured, so a deploy without the new variable keeps working.

export type GithubIdentity = { id?: number; login?: string };
export type AllowlistConfig = { id?: string; login?: string };

export function allowlistFromEnv(env: Record<string, string | undefined>): AllowlistConfig {
  return { id: env.ALLOWED_GITHUB_ID, login: env.ALLOWED_GITHUB_LOGIN };
}

export function isAllowedIdentity(who: GithubIdentity | null | undefined, config: AllowlistConfig): boolean {
  if (!who) return false;

  const allowedId = config.id?.trim();
  if (allowedId) {
    // ID mode: the login is ignored entirely, so a rename can't lock the owner
    // out and a stranger who takes over the old name can't get in.
    return typeof who.id === "number" && Number.isSafeInteger(who.id) && String(who.id) === allowedId;
  }

  const allowedLogin = config.login?.trim();
  if (allowedLogin) {
    return typeof who.login === "string" && who.login.toLowerCase() === allowedLogin.toLowerCase();
  }

  return false; // nothing configured: nobody is admin
}
