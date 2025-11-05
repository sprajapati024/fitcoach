import { Metadata } from "next";
import { ExerciseManagement } from "./ExerciseManagement";

export const metadata: Metadata = {
  title: "Exercise Library | FitCoach",
  description: "Browse and manage your exercise library",
};

export default function ExercisesPage() {
  return <ExerciseManagement />;
}
