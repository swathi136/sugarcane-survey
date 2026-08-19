import { describe, expect, it } from "vitest";
import { averageFilledObservations, buildObservationRows } from "./fieldObservations";

describe("field observations", () => {
  it("averages only filled slots and keeps zero and decimals", () => {
    expect(averageFilledObservations(["1", "", "2.5", "0", ""])).toBe(1.17);
  });

  it("creates exactly five raw rows linked to the averaged main entry", () => {
    const rows = buildObservationRows({
      mainEntryId: "entry-1",
      locationId: "L001",
      observationDay: 30,
      observationDate: "2026-08-11",
      fertigationDate: "2026-08-12",
      userId: "user-1",
      fields: [{ category: "fertigation", fieldName: "n_kg", values: ["1", "", "2.5", "0", ""] }],
    });

    expect(rows).toHaveLength(5);
    expect(rows.map((row) => [row.observation_no, row.n_kg])).toEqual([
      [1, 1], [2, null], [3, 2.5], [4, 0], [5, null],
    ]);
    expect(rows.every((row) => row.observation_day === 30)).toBe(true);
    expect(rows.every((row) => row.main_entry_id === "entry-1")).toBe(true);
    expect(rows.every((row) => row.location_id === "L001")).toBe(true);
  });
});
