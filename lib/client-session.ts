const STORAGE_KEY = "onebrief_client_session";

/** Stable anonymous id per browser — used to attribute feedback / requests on the token link. */
export function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function clientPortalJsonHeaders(sessionId: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionId) headers["X-Client-Session"] = sessionId;
  return headers;
}
