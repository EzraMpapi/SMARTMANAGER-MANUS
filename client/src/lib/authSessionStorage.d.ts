export type StoredAuthSession = { access_token: string; refresh_token: string };

export function persistAuthSession(result: { access_token?: string; refresh_token?: string }, remember?: boolean): void;
export function readStoredAuthSession(): StoredAuthSession | null;
export function clearStoredAuthSession(): void;
