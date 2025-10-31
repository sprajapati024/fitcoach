import { describe, expect, it } from "vitest";
import { convertHeightToCm, convertWeightToKg, convertCmToIn, convertKgToLb } from "@/lib/unitConversion";

describe("unitConversion", () => {
  it("converts inches to centimeters", () => {
    expect(convertHeightToCm({ value: 65, unit: "in" })).toBeCloseTo(165.1, 1);
  });

  it("converts centimeters to inches", () => {
    expect(convertCmToIn(170)).toBeCloseTo(66.9, 1);
  });

  it("converts pounds to kilograms", () => {
    expect(convertWeightToKg({ value: 150, unit: "lb" })).toBeCloseTo(68, 1);
  });

  it("converts kilograms to pounds", () => {
    expect(convertKgToLb(90)).toBeCloseTo(198.4, 1);
  });

  it("throws on invalid height", () => {
    expect(() => convertHeightToCm({ value: 0, unit: "cm" })).toThrow();
  });
});
