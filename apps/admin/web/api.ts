const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.openstaff.eu"
    : "http://localhost:8080");

export async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}
