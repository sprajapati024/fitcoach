"use client";

import { useState, useEffect } from "react";
import { UserExercise } from "@/drizzle/schema";
import { Search, Check, X } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: UserExercise) => void;
  selectedExerciseIds?: string[];
}

export function ExercisePicker({
  isOpen,
  onClose,
  onSelectExercise,
  selectedExerciseIds = [],
}: ExercisePickerProps) {
  const [exercises, setExercises] = useState<UserExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<UserExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
  const [bodyParts, setBodyParts] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchQuery, selectedBodyPart]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/exercises");
      const data = await response.json();
      setExercises(data.exercises || []);

      // Extract unique body parts
      const allBodyParts = new Set<string>();
      (data.exercises || []).forEach((ex: UserExercise) => {
        ex.bodyParts.forEach((part) => allBodyParts.add(part));
      });
      setBodyParts(Array.from(allBodyParts).sort());
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercises];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.description?.toLowerCase().includes(query) ||
          ex.bodyParts.some((part) => part.toLowerCase().includes(query)) ||
          ex.equipment.some((equip) => equip.toLowerCase().includes(query))
      );
    }

    // Body part filter
    if (selectedBodyPart) {
      filtered = filtered.filter((ex) =>
        ex.bodyParts.includes(selectedBodyPart)
      );
    }

    setFilteredExercises(filtered);
  };

  const handleSelectExercise = (exercise: UserExercise) => {
    onSelectExercise(exercise);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Exercise from Library</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200 placeholder-neutral-500"
            />
          </div>

          {/* Body Part Filter */}
          {bodyParts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBodyPart("")}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedBodyPart === ""
                    ? "bg-neural-500 text-white"
                    : "bg-surface-2 text-neutral-400 hover:bg-surface-3"
                }`}
              >
                All Body Parts
              </button>
              {bodyParts.slice(0, 8).map((part) => (
                <button
                  key={part}
                  onClick={() => setSelectedBodyPart(part)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    selectedBodyPart === part
                      ? "bg-neural-500 text-white"
                      : "bg-surface-2 text-neutral-400 hover:bg-surface-3"
                  }`}
                >
                  {part}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-neural-400 border-t-transparent"></div>
              <p className="mt-4 text-neutral-400">Loading exercises...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 mb-2">No exercises found</p>
              {exercises.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Add exercises to your library from the Exercises page first.
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  Try adjusting your search or filters.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExercises.map((exercise) => {
                const isSelected = selectedExerciseIds.includes(
                  exercise.exerciseId
                );

                return (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelectExercise(exercise)}
                    className={`text-left bg-surface-1 border rounded-lg overflow-hidden hover:border-neural-400 transition-colors ${
                      isSelected ? "border-green-500" : "border-border"
                    }`}
                  >
                    <div className="flex gap-3 p-4">
                      {/* Exercise Image */}
                      {(exercise.imageUrl || exercise.gifUrl) && (
                        <div className="w-20 h-20 flex-shrink-0 bg-surface-2 rounded overflow-hidden">
                          <img
                            src={exercise.gifUrl || exercise.imageUrl || ""}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Exercise Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm flex-1 line-clamp-2">
                            {exercise.name}
                          </h3>
                          {isSelected && (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Tags */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {exercise.bodyParts.slice(0, 2).map((part) => (
                            <span
                              key={part}
                              className="px-2 py-0.5 bg-neural-900/30 text-neural-300 text-xs rounded"
                            >
                              {part}
                            </span>
                          ))}
                          {exercise.equipment.slice(0, 1).map((equip) => (
                            <span
                              key={equip}
                              className="px-2 py-0.5 bg-surface-2 text-neutral-400 text-xs rounded"
                            >
                              {equip}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-400">
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? "s" : ""} available
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-2 hover:bg-surface-3 text-neutral-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
