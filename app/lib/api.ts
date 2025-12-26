export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/backend";

export async function fetchWithAdminAuth(path: string, init: RequestInit = {}) {
  const token =
    (typeof window !== "undefined" &&
      (localStorage.getItem("admin_token") || localStorage.getItem("token"))) ||
    "";

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
}
