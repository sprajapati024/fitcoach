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
 * POST /api/workouts/[workoutId]/exercises
 * Add an exercise to a workout block
 */
export async function POST(
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
    const { blockIndex, exercise, position } = body as {
      blockIndex: number;
      exercise: Exercise;
      position?: number;
    };

    // Validate required fields
    if (blockIndex === undefined || !exercise) {
      return NextResponse.json(
        { error: "blockIndex and exercise are required" },
        { status: 400 }
      );
    }

    // Validate exercise structure
    if (!exercise.id || !exercise.name || !exercise.equipment) {
      return NextResponse.json(
        { error: "Exercise must have id, name, and equipment" },
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

    // Add exercise to the block
    const block = payload.blocks[blockIndex];
    const insertPosition =
      position !== undefined ? position : block.exercises.length;

    // Insert at specified position
    block.exercises.splice(insertPosition, 0, exercise);

    // Update the workout
    await db
      .update(workouts)
      .set({
        payload: payload as any,
        updatedAt: new Date(),
      })
      .where(eq(workouts.id, workoutId));

    // If this is week 0 (first week), also update the plan's microcycle
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
            microcycleBlock.exercises.splice(insertPosition, 0, exercise);

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

    return NextResponse.json({
      success: true,
      message: "Exercise added successfully",
      workout: {
        id: workout.id,
        payload,
      },
    });
  } catch (error) {
    console.error("Error adding exercise to workout:", error);
    return NextResponse.json(
      { error: "Failed to add exercise to workout" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workouts/[workoutId]/exercises?blockIndex=0&exerciseId=abc
 * Remove an exercise from a workout block
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workoutId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workoutId } = await params;
    const { searchParams } = new URL(request.url);
    const blockIndex = parseInt(searchParams.get("blockIndex") || "");
    const exerciseId = searchParams.get("exerciseId");

    if (isNaN(blockIndex) || !exerciseId) {
      return NextResponse.json(
        { error: "blockIndex and exerciseId are required" },
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

    // Find and remove the exercise
    const block = payload.blocks[blockIndex];
    const exerciseIndex = block.exercises.findIndex(
      (ex) => ex.id === exerciseId
    );

    if (exerciseIndex === -1) {
      return NextResponse.json(
        { error: "Exercise not found in block" },
        { status: 404 }
      );
    }

    block.exercises.splice(exerciseIndex, 1);

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
            const microcycleExerciseIndex = microcycleBlock.exercises.findIndex(
              (ex: any) => ex.id === exerciseId
            );
            if (microcycleExerciseIndex !== -1) {
              microcycleBlock.exercises.splice(microcycleExerciseIndex, 1);

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
      message: "Exercise removed successfully",
    });
  } catch (error) {
    console.error("Error removing exercise from workout:", error);
    return NextResponse.json(
      { error: "Failed to remove exercise from workout" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workouts/[workoutId]/exercises
 * Update an exercise in a workout block
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
    const { blockIndex, exerciseId, updates } = body as {
      blockIndex: number;
      exerciseId: string;
      updates: Partial<Exercise>;
    };

    if (blockIndex === undefined || !exerciseId || !updates) {
      return NextResponse.json(
        { error: "blockIndex, exerciseId, and updates are required" },
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

    // Find and update the exercise
    const block = payload.blocks[blockIndex];
    const exerciseIndex = block.exercises.findIndex(
      (ex) => ex.id === exerciseId
    );

    if (exerciseIndex === -1) {
      return NextResponse.json(
        { error: "Exercise not found in block" },
        { status: 404 }
      );
    }

    // Update exercise properties
    block.exercises[exerciseIndex] = {
      ...block.exercises[exerciseIndex],
      ...updates,
    };

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
            const microcycleExerciseIndex = microcycleBlock.exercises.findIndex(
              (ex: any) => ex.id === exerciseId
            );
            if (microcycleExerciseIndex !== -1) {
              microcycleBlock.exercises[microcycleExerciseIndex] = {
                ...microcycleBlock.exercises[microcycleExerciseIndex],
                ...updates,
              };

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
      message: "Exercise updated successfully",
      exercise: block.exercises[exerciseIndex],
    });
  } catch (error) {
    console.error("Error updating exercise in workout:", error);
    return NextResponse.json(
      { error: "Failed to update exercise in workout" },
      { status: 500 }
    );
  }
}
