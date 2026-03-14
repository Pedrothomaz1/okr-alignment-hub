import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useRoles hook
const mockUseRoles = vi.fn();
vi.mock("@/hooks/useRoles", () => ({
  useRoles: () => mockUseRoles(),
}));

// Import after mocks
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

function renderWithRouter(ui: React.ReactElement, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows loading state when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-123", email: "user@test.com" },
      loading: false,
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("shows loading state when roles are loading", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-123" },
      loading: false,
    });
    mockUseRoles.mockReturnValue({ isAdmin: false, isLoading: true });

    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("renders children when user is admin", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-123" },
      loading: false,
    });
    mockUseRoles.mockReturnValue({ isAdmin: true, isLoading: false });

    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );

    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });

  it("redirects non-admin users", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-123" },
      loading: false,
    });
    mockUseRoles.mockReturnValue({ isAdmin: false, isLoading: false });

    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );

    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockUseRoles.mockReturnValue({ isAdmin: false, isLoading: false });

    renderWithRouter(
      <AdminRoute><div>Admin Content</div></AdminRoute>
    );

    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });
});
