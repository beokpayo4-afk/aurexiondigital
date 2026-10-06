export type PublicUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  roles: string[];
};

export function canOpenAdmin(roles: readonly string[]): boolean {
  return roles.includes("ADMIN") || roles.includes("STAFF");
}

export type AuthState = {
  user: PublicUser | null;
  subject: string | null;
  roles: string[];
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<PublicUser>;
  register: (input: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
};
