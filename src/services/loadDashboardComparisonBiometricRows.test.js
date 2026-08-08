import { beforeEach, describe, expect, it, vi } from "vitest";

const range = vi.fn();
const rpc = vi.fn(() => ({ range }));
vi.mock("../utils/supabaseClient", () => ({ supabase: { rpc } }));
const { COMPARISON_BIOMETRIC_RPC, loadDashboardComparisonBiometricRows } = await import("./loadDashboardComparisonBiometricRows");

describe("loadDashboardComparisonBiometricRows", () => {
  beforeEach(() => { rpc.mockClear(); range.mockReset(); });

  it("calls only the fixed biometric analytics RPC", async () => {
    const rows = [{ location_id: "L001", plot_id: "P001", observation_day: 30 }];
    range.mockResolvedValueOnce({ data: rows, error: null });
    await expect(loadDashboardComparisonBiometricRows()).resolves.toEqual({ rows, error: null });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(COMPARISON_BIOMETRIC_RPC);
    expect(range).toHaveBeenCalledWith(0, 999);
  });

  it("propagates a useful source-specific error", async () => {
    const error = new Error("unavailable");
    range.mockResolvedValueOnce({ data: null, error });
    await expect(loadDashboardComparisonBiometricRows()).rejects.toThrow('dashboard_biometric_source');
  });

  it("loads every deterministic RPC page", async () => {
    const first = Array.from({ length: 1000 }, (_, index) => ({ plot_id: `P${index}` }));
    range.mockResolvedValueOnce({ data: first, error: null }).mockResolvedValueOnce({ data: [{ plot_id: "last" }], error: null });
    const result = await loadDashboardComparisonBiometricRows();
    expect(result.rows).toHaveLength(1001);
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});
