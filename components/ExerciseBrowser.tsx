"use client";

import { useState, useEffect } from "react";
import { Exercise } from "@/lib/exercisedb";
import { Search, Filter, Plus, Check } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

interface ExerciseBrowserProps {
  onAddExercise?: (exercise: Exercise) => void;
  savedExerciseIds?: string[];
}

export function ExerciseBrowser({
  onAddExercise,
  savedExerciseIds = [],
}: ExerciseBrowserProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovement, setSelectedMovement] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [movements, setMovements] = useState<Array<{ value: string; label: string }>>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [addingExercise, setAddingExercise] = useState<string | null>(null);

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const response = await fetch("/api/exercises/filters");
        const data = await response.json();
        setMovements(data.movements || []);
        setEquipmentTypes(data.equipmentTypes || []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    }
    fetchFilters();
  }, []);

  // Fetch exercises
  useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (selectedMovement) params.set("movement", selectedMovement);
        if (selectedEquipment) params.set("equipment", selectedEquipment);

        const response = await fetch(`/api/exercises/browse?${params.toString()}`);
        const data = await response.json();
        setExercises(data.exercises || []);
        setFilteredExercises(data.exercises || []);
      } catch (error) {
        console.error("Error fetching exercises:", error);
        setExercises([]);
        setFilteredExercises([]);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(fetchExercises, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedMovement, selectedEquipment]);

  const handleAddExercise = async (exercise: Exercise) => {
    setAddingExercise(exercise.id);
    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exerciseId: exercise.id,
          name: exercise.name,
          description: exercise.instructions?.[0] || "",
          instructions: exercise.instructions || [],
          imageUrl: exercise.imageUrl,
          videoUrl: exercise.videoUrl,
          gifUrl: exercise.gifUrl,
          equipment: exercise.equipment,
          bodyParts: exercise.bodyPart ? [exercise.bodyPart] : [],
          targetMuscles: exercise.target ? [exercise.target] : [],
          secondaryMuscles: exercise.secondaryMuscles || [],
          exerciseType: exercise.exerciseType || "strength",
          source: "catalog",
          isPcosSafe: exercise.isPcosSafe,
          impactLevel: exercise.impactLevel,
        }),
      });

      if (response.ok) {
        onAddExercise?.(exercise);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add exercise");
      }
    } catch (error) {
      console.error("Error adding exercise:", error);
      alert("Failed to add exercise");
    } finally {
      setAddingExercise(null);
    }
  };

  const isExerciseSaved = (exerciseId: string) => savedExerciseIds.includes(exerciseId);

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search exercises by name, body part, or muscle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-surface-1 rounded-lg border border-border">
            <div>
              <label className="block text-sm font-medium mb-2">Movement Pattern</label>
              <select
                value={selectedMovement}
                onChange={(e) => setSelectedMovement(e.target.value)}
                className="w-full px-3 py-2 bg-surface-0 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="">All Movements</option>
                {movements.map((movement) => (
                  <option key={movement.value} value={movement.value}>
                    {movement.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Equipment</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 bg-surface-0 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              >
                <option value="">All Equipment</option>
                {equipmentTypes.map((equip) => (
                  <option key={equip} value={equip}>
                    {equip}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-neutral-400">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Exercise Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neural-400 border-t-transparent"></div>
          <p className="mt-4 text-neutral-400">Loading exercises...</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p>No exercises found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-surface-1 border border-border rounded-lg overflow-hidden hover:border-neural-400 transition-colors"
            >
              {/* Exercise Image/GIF */}
              {(exercise.imageUrl || exercise.gifUrl) && (
                <div className="aspect-video bg-surface-2 overflow-hidden">
                  <img
                    src={exercise.gifUrl || exercise.imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Exercise Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">{exercise.name}</h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {exercise.bodyPart && (
                    <span className="px-2 py-1 bg-neural-900/30 text-neural-300 text-xs rounded capitalize">
                      {exercise.bodyPart}
                    </span>
                  )}
                  {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                    <span className="px-2 py-1 bg-neural-900/30 text-neural-300 text-xs rounded capitalize">
                      {exercise.secondaryMuscles[0]}
                    </span>
                  )}
                  {exercise.equipment && (
                    <span className="px-2 py-1 bg-surface-2 text-neutral-400 text-xs rounded capitalize">
                      {exercise.equipment}
                    </span>
                  )}
                </div>

                {/* Instructions/Notes */}
                {exercise.instructions && exercise.instructions.length > 0 && (
                  <p className="text-sm text-neutral-400 line-clamp-2">
                    {exercise.instructions[0]}
                  </p>
                )}

                {/* Impact Badge */}
                {exercise.impactLevel && (
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      exercise.impactLevel === "low"
                        ? "bg-green-900/30 text-green-300"
                        : exercise.impactLevel === "moderate"
                        ? "bg-yellow-900/30 text-yellow-300"
                        : "bg-red-900/30 text-red-300"
                    }`}
                  >
                    {exercise.impactLevel} impact
                  </span>
                )}

                {/* Add Button */}
                <PrimaryButton
                  onClick={() => handleAddExercise(exercise)}
                  disabled={isExerciseSaved(exercise.id) || addingExercise === exercise.id}
                  className="w-full mt-4"
                >
                  {addingExercise === exercise.id ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Adding...
                    </>
                  ) : isExerciseSaved(exercise.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Library
                    </>
                  )}
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
