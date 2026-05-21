import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { auth, signInWithGoogle, signOut, onAuthChange } from "@/lib/firebase";

interface AuthContextType {
  session: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signinRedirect: () => Promise<void>;
  removeUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setSession(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthContextType = {
    session,
    loading,
    isAuthenticated: !!session,
    user: session,
    isLoading: loading,
    error,
    signinRedirect: async () => {
      try {
        setError(null);
        await signInWithGoogle();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
        throw e;
      }
    },
    removeUser: async () => {
      try {
        await signOut();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-out failed");
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within FirebaseAuthProvider");
  return ctx;
}

export function useFirebaseAuth() {
  return useAuth();
}
