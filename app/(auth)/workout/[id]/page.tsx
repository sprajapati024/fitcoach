interface WorkoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { id } = await params;
  return (
    <div className="p-6 text-fg0">
      <h1 className="text-2xl font-semibold">Workout {id}</h1>
      <p className="text-fg2">Exercise logger coming soon.</p>
    </div>
  );
}
