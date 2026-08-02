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
});
