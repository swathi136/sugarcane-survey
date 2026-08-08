import { beforeEach, describe, expect, it, vi } from "vitest";

const range = vi.fn();
const rpc = vi.fn(() => ({ range }));
vi.mock("../utils/supabaseClient", () => ({ supabase: { rpc } }));
const { COMPARISON_FERTIGATION_RPC, loadDashboardComparisonFertigationRows } = await import("./loadDashboardComparisonFertigationRows");

describe("loadDashboardComparisonFertigationRows", () => {
  beforeEach(() => { rpc.mockClear(); range.mockReset(); });

  it("calls only the fixed fertigation analytics RPC", async () => {
    const rows = [{ location_id: "L001", plot_id: "P001", day_after_planting: 10 }];
    range.mockResolvedValueOnce({ data: rows, error: null });
    await expect(loadDashboardComparisonFertigationRows()).resolves.toEqual({ rows, error: null });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(COMPARISON_FERTIGATION_RPC);
    expect(range).toHaveBeenCalledWith(0, 999);
  });

  it("propagates a useful source-specific error", async () => {
    const error = new Error("unavailable");
    range.mockResolvedValueOnce({ data: null, error });
    await expect(loadDashboardComparisonFertigationRows()).rejects.toThrow('dashboard_fertigation_source');
  });
});
