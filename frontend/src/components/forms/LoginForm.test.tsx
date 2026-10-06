import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/forms/LoginForm";
import { AuthContext } from "@/context/auth-context";
import { authState, testUser } from "@/test/auth";

describe("LoginForm", () => {
  it("shows validation messages before calling sign-in", async () => {
    const signIn = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={authState({ signIn })}>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email.")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("stays on the site after a successful sign-in", async () => {
    const signIn = vi.fn(async () => testUser(["CUSTOMER"]));
    const user = userEvent.setup();
    render(
      <AuthContext.Provider value={authState({ signIn })}>
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: "//evil.example" } }]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/account" element={<h1>Account</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith("ada@example.com", "correct-horse");
  });
});
