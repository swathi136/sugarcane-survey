import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock("../utils/supabaseClient", () => ({ supabase: { rpc: mocks.rpc, from: mocks.from } }));
import { APPROVED_ANTHIYUR_RPC, loadApprovedAnthiyurData } from "./loadApprovedAnthiyurData";

describe("Approved Anthiyur RPC loader", () => {
  beforeEach(() => vi.clearAllMocks());
  it("does not request at module scope", () => expect(mocks.rpc).not.toHaveBeenCalled());
  it("uses only the safe RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ id: "x" }], error: null });
    await expect(loadApprovedAnthiyurData()).resolves.toEqual({ rows: [{ id: "x" }], error: null });
    expect(mocks.rpc).toHaveBeenCalledWith(APPROVED_ANTHIYUR_RPC);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each([
    [{ data: [], error: null }, { rows: [], error: null }],
    [{ data: null, error: { message: "denied" } }, { rows: [], error: { message: "denied" } }],
  ])("distinguishes empty success and errors", async (response, expected) => {
    mocks.rpc.mockResolvedValue(response);
    await expect(loadApprovedAnthiyurData()).resolves.toEqual(expected);
  });
});
