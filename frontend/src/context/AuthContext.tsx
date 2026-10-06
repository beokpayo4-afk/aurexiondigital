import { useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext } from "@/context/auth-context";
import { clearTokens } from "@/api/client";
import { currentUser, login, logout, registerAccount } from "@/services/authService";
import type { AuthState, PublicUser } from "@/types/auth";
import { apiErrorMessage } from "@/utils/apiError";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    currentUser()
      .then((next) => {
        if (active) {
          setUser(next);
        }
      })
      .catch(() => {
        clearTokens();
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      subject: user?.id ?? null,
      roles: user?.roles ?? [],
      isAuthenticated: user !== null,
      isReady,
      signIn: async (email, password) => {
        try {
          const next = await login(email, password);
          setUser(next);
          return next;
        } catch (error) {
          throw new Error(apiErrorMessage(error, "Sign-in failed."));
        }
      },
      register: async (input) => {
        try {
          setUser(await registerAccount(input));
        } catch (error) {
          throw new Error(apiErrorMessage(error, "Registration failed."));
        }
      },
      signOut: async () => {
        try {
          await logout();
        } finally {
          setUser(null);
        }
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
