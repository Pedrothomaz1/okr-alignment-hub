import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      insert: mockInsert,
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

import { useCycles } from "@/hooks/useCycles";
import { useAuth } from "@/hooks/useAuth";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCycles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createCycle throws when not authenticated", async () => {
    (useAuth as any).mockReturnValue({ user: null });

    const { result } = renderHook(() => useCycles(), { wrapper: createWrapper() });

    await expect(
      result.current.createCycle.mutateAsync({
        name: "Q1",
        start_date: "2025-01-01",
        end_date: "2025-03-31",
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("createCycle passes created_by with user.id", async () => {
    (useAuth as any).mockReturnValue({ user: { id: "user-789" } });
    mockSingle.mockResolvedValue({ data: { id: "cycle-new" }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useCycles(), { wrapper: createWrapper() });

    await result.current.createCycle.mutateAsync({
      name: "Q1",
      start_date: "2025-01-01",
      end_date: "2025-03-31",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ created_by: "user-789" })
    );
  });
});
