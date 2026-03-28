import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

import { useCheckins } from "@/hooks/useCheckins";
import { useAuth } from "@/hooks/useAuth";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCheckins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when keyResultId is undefined", async () => {
    const { result } = renderHook(() => useCheckins(undefined), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.checkins).toEqual([]);
  });

  it("createCheckin throws when not authenticated", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useCheckins("kr-1"), { wrapper: createWrapper() });

    await expect(
      result.current.createCheckin.mutateAsync({
        key_result_id: "kr-1",
        value: 50,
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("createCheckin adds author_id from user", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-checkin" } });
    mockSingle.mockResolvedValue({ data: { id: "checkin-new" }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCheckins("kr-1"), { wrapper: createWrapper() });

    await result.current.createCheckin.mutateAsync({
      key_result_id: "kr-1",
      value: 75,
      note: "Good progress",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ author_id: "user-checkin" })
    );
  });
});
