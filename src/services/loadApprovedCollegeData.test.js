import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(),
}));

vi.mock("../utils/supabaseClient", () => ({
  supabase: { from: mocks.from },
}));

import {
  APPROVED_COLLEGE_DASHBOARD_COLUMNS,
  loadApprovedCollegeData,
} from "./loadApprovedCollegeData";

describe("approved College loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ order: mocks.order });
    mocks.order
      .mockReturnValueOnce({ order: mocks.order })
      .mockResolvedValueOnce({ data: [{ id: "one" }], error: null });
  });

  it("does not query during module import", () => {
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("fetches only approved rows with the explicit dashboard projection", async () => {
    await expect(loadApprovedCollegeData()).resolves.toEqual({ rows: [{ id: "one" }], error: null });
    expect(mocks.from).toHaveBeenCalledWith("field_entries");
    expect(mocks.select).toHaveBeenCalledWith(APPROVED_COLLEGE_DASHBOARD_COLUMNS);
    expect(mocks.eq).toHaveBeenCalledWith("status", "Approved");
    expect(APPROVED_COLLEGE_DASHBOARD_COLUMNS).not.toContain("created_by");
    expect(APPROVED_COLLEGE_DASHBOARD_COLUMNS).not.toContain("approved_by");
    expect(APPROVED_COLLEGE_DASHBOARD_COLUMNS).not.toContain("rejection_feedback");
  });
});
