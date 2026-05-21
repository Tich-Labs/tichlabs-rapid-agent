import { useAuth } from "@/components/providers/firebase";
import type { ReactNode } from "react";

export function Authenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export function Unauthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return null;
  return <>{children}</>;
}

export function AuthLoading({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  if (!loading) return null;
  return <>{children}</>;
}
