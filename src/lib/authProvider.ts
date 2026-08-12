/**
 * Auth provider router (hybrid Supabase ⇄ custom MySQL JWT auth).
 *
 * The active provider is stored in localStorage so it can be read
 * synchronously before the first render. Default stays "supabase";
 * an admin flips it in Admin → Database Config.
 */
export type AuthProviderKind = "supabase" | "mysql";

const LS_KEY = "auth_provider";
export const MYSQL_TOKEN_KEY = "auth_token";

export function getAuthProvider(): AuthProviderKind {
  try {
    return localStorage.getItem(LS_KEY) === "mysql" ? "mysql" : "supabase";
  } catch {
    return "supabase";
  }
}

export function isMysqlAuth(): boolean {
  return getAuthProvider() === "mysql";
}

export function setAuthProvider(kind: AuthProviderKind) {
  try {
    localStorage.setItem(LS_KEY, kind);
  } catch {
    /* ignore */
  }
}
