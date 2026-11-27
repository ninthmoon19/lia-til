// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowlistFromEnv, isAllowedIdentity } from "./allowlist.ts";

const OWNER = { id: 1234567, login: "new-name" };

test("ID mode admits the owner by numeric ID, whatever the login is", () => {
  const config = { id: "1234567", login: "old-name" };
  assert.equal(isAllowedIdentity(OWNER, config), true);
  assert.equal(isAllowedIdentity({ id: 1234567, login: "renamed-again" }, config), true);
  assert.equal(isAllowedIdentity({ id: 1234567 }, config), true);
});

test("ID mode ignores the login: someone holding the configured login is denied", () => {
  const config = { id: "1234567", login: "old-name" };
  assert.equal(isAllowedIdentity({ id: 999, login: "old-name" }, config), false);
});

test("ID mode denies a session without an ID (cookie minted before the ID was stored)", () => {
  const config = { id: "1234567" };
  assert.equal(isAllowedIdentity({ login: "new-name" }, config), false);
  assert.equal(isAllowedIdentity({ id: "1234567", login: "new-name" }, config), false); // string, not number
});

test("ID mode tolerates whitespace around the env value", () => {
  assert.equal(isAllowedIdentity(OWNER, { id: " 1234567\n" }), true);
});

test("login fallback applies only when no ID is configured, case-insensitively", () => {
  assert.equal(isAllowedIdentity(OWNER, { login: "New-Name" }), true);
  assert.equal(isAllowedIdentity(OWNER, { id: "", login: "new-name" }), true);
  assert.equal(isAllowedIdentity(OWNER, { id: "   ", login: "new-name" }), true);
  assert.equal(isAllowedIdentity(OWNER, { login: "old-name" }), false);
});

test("nothing configured, or no identity: nobody is admin", () => {
  assert.equal(isAllowedIdentity(OWNER, {}), false);
  assert.equal(isAllowedIdentity(OWNER, { id: "", login: "" }), false);
  assert.equal(isAllowedIdentity(null, { id: "1234567" }), false);
  assert.equal(isAllowedIdentity(undefined, { login: "new-name" }), false);
});

test("allowlistFromEnv reads both variables", () => {
  assert.deepEqual(allowlistFromEnv({ ALLOWED_GITHUB_ID: "1", ALLOWED_GITHUB_LOGIN: "x", OTHER: "y" }), {
    id: "1",
    login: "x",
  });
});
