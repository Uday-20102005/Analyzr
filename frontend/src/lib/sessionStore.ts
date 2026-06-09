const SESSION_KEY = 'analyzr_session';

export function saveSession(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
