import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/lib/auth-context";

/**
 * Admin status comes from the server (users.role). The local email list in the auth
 * context is only a fallback; every admin call is checked again on the server.
 */
export function useIsAdmin(): boolean {
  const { isAdmin: localAdmin, isAuthenticated } = useAppAuth();
  const me = trpc.auth.me.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  return localAdmin || me.data?.role === "admin";
}
