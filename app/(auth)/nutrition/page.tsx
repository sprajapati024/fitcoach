import { Metadata } from "next";
import { NutritionView } from "./NutritionView";

export const metadata: Metadata = {
  title: "Nutrition | FitCoach",
  description: "Track your nutrition and hydration",
};

export default function NutritionPage() {
  return <NutritionView />;
}
