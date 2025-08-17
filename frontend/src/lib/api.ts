const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:3003/api";
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export function getApiBase() {
  return API_BASE;
}

// Public GET helpers (no API key)
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

// Dev-only POST helper: do NOT use with secrets in production client.
// Prefer server-side proxy routes on Vercel for protected endpoints.
export async function apiPost<T = any>(path: string, body: any, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

// Local-only: uses VITE_API_KEY automatically. Do NOT ship to production without a server proxy.
export async function apiPostProtected<T = any>(path: string, body: any): Promise<T> {
  if (!API_KEY) throw new Error("Missing VITE_API_KEY for protected call in local testing");
  return apiPost<T>(path, body, API_KEY);
}
