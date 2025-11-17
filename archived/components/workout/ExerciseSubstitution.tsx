'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { X, ArrowRight, Loader2 } from 'lucide-react';

interface ExerciseSubstitutionProps {
  planId: string;
  workoutId: string;
  exerciseId: string;
  exerciseName: string;
  onSubstitute?: (newExerciseId: string, newExerciseName: string) => void;
  onClose?: () => void;
}

interface Alternative {
  exerciseId: string;
  exerciseName: string;
  equipment: string;
  movement: string;
  impact: string;
  isPcosFriendly: boolean;
  rationale: string;
}

interface SubstitutionApiResponse {
  success: boolean;
  originalExercise?: {
    id: string;
    name: string;
    movement: string;
    equipment: string;
    primaryMuscle: string;
  };
  alternatives?: Alternative[];
  error?: string;
}

export function ExerciseSubstitution({
  planId,
  workoutId,
  exerciseId,
  exerciseName,
  onSubstitute,
  onClose,
}: ExerciseSubstitutionProps) {
  const [reason, setReason] = useState('');
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleFetchAlternatives = async () => {
    setIsLoading(true);
    setError(null);
    setShowAlternatives(false);

    try {
      const response = await fetch('/api/substitution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          workoutId,
          exerciseId,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.error || 'Unable to fetch alternatives.');
      }

      const payload = (await response.json()) as SubstitutionApiResponse;

      if (!payload.alternatives || payload.alternatives.length === 0) {
        throw new Error('No suitable alternatives found.');
      }

      setAlternatives(payload.alternatives);
      setShowAlternatives(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch alternatives.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (alt: Alternative) => {
    if (onSubstitute) {
      onSubstitute(alt.exerciseId, alt.exerciseName);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-surface-0 text-text-primary">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-0 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Substitute Exercise</h2>
            <p className="text-sm text-text-muted">{exerciseName}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-text-muted transition hover:bg-surface-1 hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {!showAlternatives ? (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-text-secondary">
                Reason for substitution (optional)
              </label>
              <input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., equipment unavailable, injury, preference"
                className="mt-1 w-full rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder-fg3 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                maxLength={120}
              />
              <p className="mt-1 text-xs text-fg3">
                Helps us suggest better alternatives
              </p>
            </div>

            <button
              type="button"
              onClick={handleFetchAlternatives}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-text-primary px-4 py-2 text-sm font-semibold text-surface-0 transition hover:bg-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding alternatives…
                </>
              ) : (
                <>
                  Find Alternatives
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              We found {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} for you:
            </p>

            {alternatives.map((alt, index) => (
              <Card
                key={alt.exerciseId}
                className="space-y-2 border border-surface-border bg-surface-1 p-4 transition hover:border-fg3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{alt.exerciseName}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-muted">
                      <span className="rounded-full bg-surface-0 px-2 py-0.5">{alt.equipment}</span>
                      <span className="rounded-full bg-surface-0 px-2 py-0.5">{alt.movement}</span>
                      <span className="rounded-full bg-surface-0 px-2 py-0.5">{alt.impact} impact</span>
                      {alt.isPcosFriendly && (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-400">
                          PCOS-friendly
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-text-secondary">{alt.rationale}</p>

                <button
                  type="button"
                  onClick={() => handleSelect(alt)}
                  className="mt-2 w-full rounded-md border border-text-muted bg-surface-0 px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-text-muted hover:text-surface-0"
                >
                  Select This Exercise
                </button>
              </Card>
            ))}

            <button
              type="button"
              onClick={() => {
                setShowAlternatives(false);
                setReason('');
              }}
              className="w-full rounded-md border border-surface-border bg-surface-1 px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-0 hover:text-text-primary"
            >
              Try Different Search
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
