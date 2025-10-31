export type HeightInput = {
  value: number;
  unit: "cm" | "in";
};

export type WeightInput = {
  value: number;
  unit: "kg" | "lb";
};

export function convertHeightToCm(input: HeightInput): number {
  const { value, unit } = input;
  if (Number.isNaN(value) || value <= 0) {
    throw new Error("Height value must be positive");
  }
  return unit === "cm" ? value : Math.round(value * 2.54 * 10) / 10;
}

export function convertWeightToKg(input: WeightInput): number {
  const { value, unit } = input;
  if (Number.isNaN(value) || value <= 0) {
    throw new Error("Weight value must be positive");
  }
  return unit === "kg" ? value : Math.round(value * 0.453592 * 10) / 10;
}

export function convertCmToIn(cm: number): number {
  if (Number.isNaN(cm) || cm <= 0) {
    throw new Error("Height (cm) must be positive");
  }
  return Math.round((cm / 2.54) * 10) / 10;
}

export function convertKgToLb(kg: number): number {
  if (Number.isNaN(kg) || kg <= 0) {
    throw new Error("Weight (kg) must be positive");
  }
  return Math.round(kg * 2.20462 * 10) / 10;
}
