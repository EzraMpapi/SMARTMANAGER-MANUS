import { startLogin } from "@/const";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCallback, useEffect } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const auth = useAuthContext();
  const user = auth.user
    ? { ...auth.user, role: auth.role || "user" }
    : null;

  const refresh = useCallback(() => auth.refresh(), [auth.refresh]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || auth.loading || auth.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
    else startLogin();
  }, [auth.isAuthenticated, auth.loading, redirectOnUnauthenticated, redirectPath]);

  return {
    user,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    refresh,
    logout: auth.signOut,
  };
}
