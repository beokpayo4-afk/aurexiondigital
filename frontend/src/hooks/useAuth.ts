import { useContext } from "react";

import { AuthContext } from "@/context/auth-context";
import type { AuthState } from "@/types/auth";

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
