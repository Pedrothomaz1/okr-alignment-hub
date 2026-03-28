import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: vi.fn(() => ({ eq: mockEq })),
      delete: vi.fn(() => ({ eq: mockEq })),
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

import { useObjectives } from "@/hooks/useObjectives";
import { useAuth } from "@/hooks/useAuth";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useObjectives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when cycleId is undefined", async () => {
    const { result } = renderHook(() => useObjectives(undefined), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.objectives).toEqual([]);
  });

  it("maps owner_name and kr_count from response", async () => {
    const mockData = [
      {
        id: "obj-1",
        title: "Test",
        profiles: { full_name: "Maria", avatar_url: null },
        key_results: [{ id: "kr-1" }, { id: "kr-2" }],
        status: "on_track",
        progress: 50,
      },
    ];

    mockOrder.mockResolvedValue({ data: mockData, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useObjectives("cycle-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.objectives[0]?.owner_name).toBe("Maria");
    expect(result.current.objectives[0]?.kr_count).toBe(2);
  });

  it("createObjective throws when not authenticated", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useObjectives("cycle-1"), { wrapper: createWrapper() });

    await expect(
      result.current.createObjective.mutateAsync({
        title: "Test",
        cycle_id: "cycle-1",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("createObjective uses user.id as fallback owner_id", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-123" } });
    mockSingle.mockResolvedValue({ data: { id: "obj-new" }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useObjectives("cycle-1"), { wrapper: createWrapper() });

    await result.current.createObjective.mutateAsync({
      title: "New Obj",
      cycle_id: "cycle-1",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: "user-123" })
    );
  });
});
