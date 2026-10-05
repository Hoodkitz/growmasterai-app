import { getApiBaseUrl } from "@/constants/oauth";

type Endpoint = "forgot-password" | "reset-password" | "verify-email" | "resend-verification";

/** POSTs to /api/auth/<endpoint>; throws an Error with the (German) server message on failure. */
export async function postAuth(endpoint: Endpoint, body: Record<string, string>): Promise<{ message?: string }> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Anfrage fehlgeschlagen. Bitte versuche es erneut.");
  return data;
}
