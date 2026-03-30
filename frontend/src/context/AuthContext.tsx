import { createContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const devAuthBypassEnabled =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

  useEffect(() => {
    if (devAuthBypassEnabled) {
      setUser({
        id: "dev-user",
        email: "dev@localhost",
        app_metadata: {
          provider: "development",
          providers: ["development"],
        },
        user_metadata: {
          full_name: "Development User",
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [devAuthBypassEnabled]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
