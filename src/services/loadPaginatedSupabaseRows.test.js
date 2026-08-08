import { describe, expect, it, vi } from "vitest";
import { loadPaginatedSupabaseRows } from "./loadPaginatedSupabaseRows";

describe("loadPaginatedSupabaseRows", () => {
  it("loads all pages and handles an exact page boundary", async () => {
    const fetchPage = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    const rows = await loadPaginatedSupabaseRows({ sourceName: "example_view", fetchPage, pageSize: 2 });
    expect(rows).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 1);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 3);
  });

  it("handles an empty source", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [], error: null });
    await expect(loadPaginatedSupabaseRows({ sourceName: "empty_view", fetchPage })).resolves.toEqual([]);
  });

  it("includes the failing source name in errors", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: null, error: new Error("denied") });
    await expect(loadPaginatedSupabaseRows({ sourceName: "secure_view", fetchPage })).rejects.toThrow("secure_view");
  });

  it("stops at the configured page limit", async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
    await expect(loadPaginatedSupabaseRows({ sourceName: "looping_view", fetchPage, pageSize: 1, maxPages: 2 })).rejects.toThrow("exceeded 2 pages");
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
