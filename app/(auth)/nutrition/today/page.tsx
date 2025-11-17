import { Metadata } from "next";
import { TodayNutritionView } from "./TodayNutritionView";

export const metadata: Metadata = {
  title: "Today's Nutrition | FitCoach",
  description: "View today's nutrition summary, coach brief, and meals",
};

export default function TodayNutritionPage() {
  return <TodayNutritionView />;
}
