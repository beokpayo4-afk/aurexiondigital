import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { currentUser, login, logout } from "@/services/authService";
import { testUser } from "@/test/auth";

vi.mock("@/services/authService", () => ({
  currentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  registerAccount: vi.fn(),
}));

function Probe() {
  const { isReady, isAuthenticated, user, signIn, signOut } = useAuth();
  if (!isReady) {
    return <p>Loading session</p>;
  }
  return (
    <div>
      <p>{isAuthenticated ? user?.full_name : "Signed out"}</p>
      <button type="button" onClick={() => void signIn("ada@example.com", "correct-horse")}>
        Sign in
      </button>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}

describe("authentication state", () => {
  beforeEach(() => {
    vi.mocked(currentUser).mockResolvedValue(null);
    vi.mocked(logout).mockResolvedValue();
  });

  it("starts signed out when no session is stored", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
  });

  it("keeps the signed-in user after login and clears it on sign-out", async () => {
    vi.mocked(login).mockResolvedValue(testUser(["CUSTOMER"]));
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("Signed out");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Ada Customer")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });
});
