import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthContext } from "./AuthContext";
import { supabase } from "../lib/supabase";

const PASSWORD_RECOVERY_STORAGE_KEY = "herdflow-password-recovery";

function hasRecoveryParams() {
  if (typeof window === "undefined") {
    return false;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get("type") === "recovery" ||
    searchParams.get("type") === "recovery"
  );
}

function getStoredRecoveryFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "true";
}

function setStoredRecoveryFlag(isActive: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (isActive) {
    window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true");
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
}

function createDevUser(): User {
  return {
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
  } as User;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const devAuthBypassEnabled =
    import.meta.env.DEV &&
    import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

  const [user, setUser] = useState<User | null>(() =>
    devAuthBypassEnabled ? createDevUser() : null,
  );
  const [loading, setLoading] = useState(() => !devAuthBypassEnabled);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    () => hasRecoveryParams() || getStoredRecoveryFlag(),
  );

  useEffect(() => {
    if (devAuthBypassEnabled) {
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
      if (hasRecoveryParams()) {
        setStoredRecoveryFlag(true);
        setIsPasswordRecovery(true);
      } else if (!session) {
        setStoredRecoveryFlag(false);
        setIsPasswordRecovery(false);
      }
      setLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(session?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        setStoredRecoveryFlag(true);
        setIsPasswordRecovery(true);
      } else if (event === "USER_UPDATED" || event === "SIGNED_OUT") {
        setStoredRecoveryFlag(false);
        setIsPasswordRecovery(false);
      } else if (!session && !hasRecoveryParams()) {
        setStoredRecoveryFlag(false);
        setIsPasswordRecovery(false);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [devAuthBypassEnabled]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isPasswordRecovery,
        setPasswordRecovery: (isActive) => {
          setStoredRecoveryFlag(isActive);
          setIsPasswordRecovery(isActive);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
