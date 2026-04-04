import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  setPasswordRecovery: (isActive: boolean) => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isPasswordRecovery: false,
  setPasswordRecovery: () => {},
});
