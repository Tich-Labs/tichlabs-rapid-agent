import { FirebaseAuthProvider } from "./firebase";
import type { ReactNode } from "react";

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

export { useAuth } from "./firebase";
