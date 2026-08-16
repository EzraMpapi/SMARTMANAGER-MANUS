export function signInWithAccountPasskey(input: { supabaseUrl: string; supabaseAnonKey: string }): Promise<{ access_token?: string; refresh_token?: string }>;
export function passkeySignInUserMessage(error: unknown): string;
