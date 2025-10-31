interface WorkoutPageProps {
  params: { id: string };
}

export default function WorkoutPage({ params }: WorkoutPageProps) {
  return (
    <div className="p-6 text-fg0">
      <h1 className="text-2xl font-semibold">Workout {params.id}</h1>
      <p className="text-fg2">Exercise logger coming soon.</p>
    </div>
  );
}
