import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

import { useRoles } from "@/hooks/useRoles";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useRoles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when userId is undefined", async () => {
    const { result } = renderHook(() => useRoles(undefined), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.roles).toEqual([]);
    expect(result.current.isAdmin).toBe(false);
  });

  it("hasRole returns true for matching role", async () => {
    mockEq.mockResolvedValue({ data: [{ role: "admin" }, { role: "member" }], error: null });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useRoles("user-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasRole("admin")).toBe(true);
    expect(result.current.hasRole("member")).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it("hasRole returns false for non-matching role", async () => {
    mockEq.mockResolvedValue({ data: [{ role: "member" }], error: null });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useRoles("user-2"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasRole("admin")).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });
});
