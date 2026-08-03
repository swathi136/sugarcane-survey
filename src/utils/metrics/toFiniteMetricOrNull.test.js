import { describe, expect, it } from "vitest";
import { toFiniteMetricOrNull, toIntegerMetricOrNull } from "./toFiniteMetricOrNull";

describe("metric normalization", () => {
  it.each([null, undefined, "", "   ", "bad", NaN, Infinity])("does not turn %s into zero", (value) => {
    expect(toFiniteMetricOrNull(value)).toBeNull();
  });

  it("preserves a genuine zero", () => {
    expect(toFiniteMetricOrNull(0)).toBe(0);
    expect(toIntegerMetricOrNull("241")).toBe(241);
    expect(toIntegerMetricOrNull("12.5")).toBeNull();
  });

  describe.each(["College", "Athani", "Anthiyur"])("%s records", (location) => {
    it("uses the same safe numeric rules", () => {
      expect(toFiniteMetricOrNull("45.5"), location).toBe(45.5);
      expect(toFiniteMetricOrNull(0), location).toBe(0);
      expect(toFiniteMetricOrNull(""), location).toBeNull();
      expect(toFiniteMetricOrNull("not-a-number"), location).toBeNull();
      expect(toFiniteMetricOrNull(Infinity), location).toBeNull();
      expect(toIntegerMetricOrNull("12"), location).toBe(12);
      expect(toIntegerMetricOrNull("12.5"), location).toBeNull();
    });
  });
});
