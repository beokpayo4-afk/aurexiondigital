import type { AuthState, PublicUser } from "@/types/auth";

export function testUser(roles: string[], name = "Ada Customer"): PublicUser {
  return {
    id: "user-1",
    email: "ada@example.com",
    full_name: name,
    phone: null,
    roles,
  };
}

export function authState(overrides: Partial<AuthState> = {}): AuthState {
  const user = overrides.user === undefined ? null : overrides.user;
  return {
    user,
    subject: user?.id ?? null,
    roles: user?.roles ?? [],
    isAuthenticated: user !== null,
    isReady: true,
    signIn: async () => testUser(["CUSTOMER"]),
    register: async () => undefined,
    signOut: async () => undefined,
    ...overrides,
  };
}
