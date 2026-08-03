import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn() }));
vi.mock("../utils/supabaseClient", () => ({ supabase: { from: mocks.from } }));

import { APPROVED_ATHANI_DASHBOARD_COLUMNS, loadApprovedAthaniData } from "./loadApprovedAthaniData";

describe("approved Athani loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ order: mocks.order });
  });

  it("does not query during module import", () => expect(mocks.from).not.toHaveBeenCalled());

  it("uses an explicit Approved-only deterministic query", async () => {
    mocks.order.mockReturnValueOnce({ order: mocks.order }).mockResolvedValueOnce({ data: [{ id: "a" }], error: null });
    await expect(loadApprovedAthaniData()).resolves.toEqual({ rows: [{ id: "a" }], error: null });
    expect(mocks.from).toHaveBeenCalledWith("athani_field_entries");
    expect(mocks.select).toHaveBeenCalledWith(APPROVED_ATHANI_DASHBOARD_COLUMNS);
    expect(mocks.eq).toHaveBeenCalledWith("status", "Approved");
    expect(mocks.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: true });
    expect(mocks.order).toHaveBeenNthCalledWith(2, "id", { ascending: true });
    ["created_by", "approved_by", "approved_at", "rejection_feedback", "custom_biometric"].forEach((field) => {
      expect(APPROVED_ATHANI_DASHBOARD_COLUMNS).not.toContain(field);
    });
  });

  it.each([
    [{ data: [], error: null }, { rows: [], error: null }],
    [{ data: null, error: { message: "denied" } }, { rows: [], error: { message: "denied" } }],
  ])("distinguishes empty success from failure", async (response, expected) => {
    mocks.order.mockReturnValueOnce({ order: mocks.order }).mockResolvedValueOnce(response);
    await expect(loadApprovedAthaniData()).resolves.toEqual(expected);
  });
});
