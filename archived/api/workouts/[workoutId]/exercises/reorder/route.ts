import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workouts, plans } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type Exercise = {
  id: string;
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  tempo?: string;
  cues?: string[];
  restSeconds?: number;
  notes?: string;
};

type Block = {
  type: string;
  title: string;
  exercises: Exercise[];
  durationMinutes?: number;
};

type WorkoutPayload = {
  workoutId: string;
  focus: string;
  blocks: Block[];
};

/**
 * PATCH /api/workouts/[workoutId]/exercises/reorder
 * Reorder exercises within a block
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workoutId } = await params;
    const body = await request.json();
    const { blockIndex, exerciseId, newPosition } = body as {
      blockIndex: number;
      exerciseId: string;
      newPosition: number;
    };

    if (
      blockIndex === undefined ||
      !exerciseId ||
      newPosition === undefined
    ) {
      return NextResponse.json(
        { error: "blockIndex, exerciseId, and newPosition are required" },
        { status: 400 }
      );
    }

    // Fetch the workout
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)))
      .limit(1);

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Parse the payload
    const payload = workout.payload as WorkoutPayload;

    // Validate block index
    if (blockIndex < 0 || blockIndex >= payload.blocks.length) {
      return NextResponse.json(
        { error: "Invalid block index" },
        { status: 400 }
      );
    }

    const block = payload.blocks[blockIndex];

    // Find the exercise
    const exerciseIndex = block.exercises.findIndex(
      (ex) => ex.id === exerciseId
    );

    if (exerciseIndex === -1) {
      return NextResponse.json(
        { error: "Exercise not found in block" },
        { status: 404 }
      );
    }

    // Validate new position
    if (newPosition < 0 || newPosition >= block.exercises.length) {
      return NextResponse.json(
        { error: "Invalid new position" },
        { status: 400 }
      );
    }

    // Reorder: remove from old position and insert at new position
    const [exercise] = block.exercises.splice(exerciseIndex, 1);
    block.exercises.splice(newPosition, 0, exercise);

    // Update the workout
    await db
      .update(workouts)
      .set({
        payload: payload as any,
        updatedAt: new Date(),
      })
      .where(eq(workouts.id, workoutId));

    // If this is week 0, also update the plan's microcycle
    if (workout.weekIndex === 0) {
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, workout.planId))
        .limit(1);

      if (plan) {
        const microcycle = plan.microcycle as any;
        const dayPattern = microcycle.pattern.find(
          (p: any) => p.dayIndex === workout.dayIndex
        );

        if (dayPattern) {
          const microcycleBlock = dayPattern.blocks[blockIndex];
          if (microcycleBlock) {
            const microcycleExerciseIndex =
              microcycleBlock.exercises.findIndex(
                (ex: any) => ex.id === exerciseId
              );
            if (microcycleExerciseIndex !== -1) {
              const [microcycleExercise] = microcycleBlock.exercises.splice(
                microcycleExerciseIndex,
                1
              );
              microcycleBlock.exercises.splice(newPosition, 0, microcycleExercise);

              await db
                .update(plans)
                .set({
                  microcycle: microcycle as any,
                  updatedAt: new Date(),
                })
                .where(eq(plans.id, workout.planId));
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Exercise reordered successfully",
      exercises: block.exercises,
    });
  } catch (error) {
    console.error("Error reordering exercise in workout:", error);
    return NextResponse.json(
      { error: "Failed to reorder exercise in workout" },
      { status: 500 }
    );
  }
}
