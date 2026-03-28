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

import { useKeyResults } from "@/hooks/useKeyResults";
import { useAuth } from "@/hooks/useAuth";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useKeyResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when objectiveId is undefined", async () => {
    const { result } = renderHook(() => useKeyResults(undefined), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.keyResults).toEqual([]);
  });

  it("maps owner_name from response", async () => {
    const mockData = [
      {
        id: "kr-1",
        title: "KR Test",
        profiles: { full_name: "Carlos", avatar_url: "url" },
      },
    ];

    mockOrder.mockResolvedValue({ data: mockData, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    const { result } = renderHook(() => useKeyResults("obj-1"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.keyResults[0]?.owner_name).toBe("Carlos");
  });

  it("createKeyResult throws when not authenticated", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useKeyResults("obj-1"), { wrapper: createWrapper() });

    await expect(
      result.current.createKeyResult.mutateAsync({
        title: "KR",
        objective_id: "obj-1",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("createKeyResult uses user.id as fallback owner_id", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-456" } });
    mockSingle.mockResolvedValue({ data: { id: "kr-new" }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useKeyResults("obj-1"), { wrapper: createWrapper() });

    await result.current.createKeyResult.mutateAsync({
      title: "New KR",
      objective_id: "obj-1",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: "user-456" })
    );
  });
});
