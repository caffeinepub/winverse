export const AUTH_KEY = "winverse_user_id";
export const ADMIN_KEY = "winverse_admin_token";

export function getStoredUserId(): bigint | null {
  const v = localStorage.getItem(AUTH_KEY);
  if (!v) return null;
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

export function setStoredUserId(id: bigint) {
  localStorage.setItem(AUTH_KEY, id.toString());
}

export function clearStoredUserId() {
  localStorage.removeItem(AUTH_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_KEY);
}
