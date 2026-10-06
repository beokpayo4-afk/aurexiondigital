import { api, clearTokens, readAccessToken, saveTokens } from "@/api/client";
import type { PublicUser } from "@/types/auth";

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: PublicUser;
};

function store(response: AuthResponse): PublicUser {
  saveTokens(response.access_token);
  return response.user;
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  return store(response.data);
}

export async function registerAccount(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<PublicUser> {
  const response = await api.post<AuthResponse>("/auth/register", {
    email: input.email,
    password: input.password,
    full_name: input.fullName,
  });
  return store(response.data);
}

export async function currentUser(): Promise<PublicUser | null> {
  if (!readAccessToken()) {
    return null;
  }
  const response = await api.get<PublicUser>("/auth/me");
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout", {});
  } finally {
    clearTokens();
  }
}
