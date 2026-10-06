import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AuthContext } from "@/context/auth-context";
import { RequireAdmin, RequireAuth } from "@/routes/guards";
import { authState, testUser } from "@/test/auth";

function renderAt(path: string, state = authState()) {
  return render(
    <AuthContext.Provider value={state}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<h1>Sign in</h1>} />
          <Route path="/academy/login" element={<h1>Academy sign in</h1>} />
          <Route path="/account" element={<h1>Account</h1>} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <h1>Checkout</h1>
              </RequireAuth>
            }
          />
          <Route
            path="/academy/dashboard"
            element={
              <RequireAuth loginPath="/academy/login">
                <h1>Student dashboard</h1>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <h1>Admin dashboard</h1>
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("protected routes", () => {
  it("sends an anonymous visitor from checkout to sign in", () => {
    renderAt("/checkout");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("sends an anonymous student from the academy dashboard to the academy sign-in page", () => {
    renderAt("/academy/dashboard");
    expect(screen.getByRole("heading", { name: "Academy sign in" })).toBeInTheDocument();
  });

  it("shows checkout to a signed-in customer", () => {
    renderAt("/checkout", authState({ user: testUser(["CUSTOMER"]) }));
    expect(screen.getByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  });

  it("waits while the session is still loading", () => {
    renderAt("/admin", authState({ isReady: false }));
    expect(screen.getByText("Checking session")).toBeInTheDocument();
  });

  it("sends a customer away from admin", () => {
    renderAt("/admin", authState({ user: testUser(["CUSTOMER"]) }));
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
  });

  it("allows staff into admin", () => {
    renderAt("/admin", authState({ user: testUser(["STAFF"], "Staff Member") }));
    expect(screen.getByRole("heading", { name: "Admin dashboard" })).toBeInTheDocument();
  });
});
