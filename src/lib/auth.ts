import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  role?: string;
  codeExpiresAt?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (u: AuthUser) => void;
  logout: () => void;
}

export function mapUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const meta = user.user_metadata || {};
  const email = user.email || meta.email || "";
  return {
    id: user.id,
    email,
    username:
      (meta.username as string) ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      email.split("@")[0] ||
      "user",
    avatar: meta.avatar_url as string | undefined,
    role: meta.role as string | undefined,
  };
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
