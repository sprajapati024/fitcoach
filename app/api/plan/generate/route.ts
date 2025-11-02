import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { profiles, plans, workouts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { buildPlannerPrompt } from "@/lib/ai/buildPrompt";
import { callPlanner } from "@/lib/ai/client";
import { runPlannerAgent } from "@/lib/ai/agents/planner-agent";
import { postProcessPlannerResponse } from "@/lib/ai/postProcessor";
import { plannerResponseSchema } from "@/lib/validation";
import { plannerSystemPrompt } from "@/lib/ai/prompts";
import { expandPlannerResponse } from "@/lib/calendar";
import { createPlanId } from "@/lib/ids";

// Helper to send SSE message
function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send progress updates
      const sendProgress = (stage: string, message: string, percent: number) => {
        const data = createSSEMessage({ type: 'progress', stage, message, percent });
        controller.enqueue(encoder.encode(data));
      };

      // Helper to send error
      const sendError = (error: string, technicalDetails?: string) => {
        const data = createSSEMessage({ type: 'error', error, technicalDetails });
        controller.enqueue(encoder.encode(data));
        controller.close();
      };

      // Helper to send completion
      const sendComplete = (result: any) => {
        const data = createSSEMessage({ type: 'complete', data: result });
        controller.enqueue(encoder.encode(data));
        controller.close();
      };

      try {
          sendProgress('initializing', 'Starting plan generation...', 0);
          // Authenticate user
          sendProgress('authenticating', 'Verifying your account...', 5);
          const supabase = await createSupabaseServerClient();
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            sendError("Unauthorized");
            return;
          }

          // Get user profile
          sendProgress('loading_profile', 'Loading your profile...', 10);
          const [userProfile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1);

          if (!userProfile) {
            sendError("Profile not found. Please complete onboarding first.");
            return;
          }

          // Validate profile has required fields
          if (
            !userProfile.scheduleDaysPerWeek ||
            !userProfile.scheduleMinutesPerSession ||
            !userProfile.scheduleWeeks
          ) {
            sendError("Incomplete profile. Please complete all onboarding steps.");
            return;
          }

          console.log("[Plan Generation] Starting for user:", user.id);
          console.log("[Plan Generation] Using OpenAI Agents SDK...");

          sendProgress('analyzing', 'Analyzing your profile and goals...', 15);

          // Call OpenAI planner agent with retry logic
          let aiResult;
          let attemptNumber = 1;
          const maxAttempts = 2;

          while (attemptNumber <= maxAttempts) {
            try {
              console.log(`[Plan Generation] Attempt ${attemptNumber}/${maxAttempts}...`);

              if (attemptNumber === 1) {
                sendProgress('querying', 'Finding suitable exercises...', 25);
              } else {
                sendProgress('retrying', 'Retrying plan generation...', 25);
              }

              aiResult = await runPlannerAgent(userProfile);

              if (!aiResult.success || !aiResult.data) {
                throw new Error('Agent returned unsuccessful result or no data');
              }

              // Success! Break out of retry loop
              console.log("[Plan Generation] Agent completed successfully");
              sendProgress('validating', 'Validating your plan...', 70);
              break;
            } catch (error) {
              console.error(`[Plan Generation] Attempt ${attemptNumber} failed:`, error);

              const errorMessage = error instanceof Error ? error.message : 'Unknown error';

              // If this was the last attempt, return error
              if (attemptNumber === maxAttempts) {
                // Provide user-friendly error messages based on error type
                let userMessage = "Unable to generate your training plan. ";

                if (errorMessage.includes("Max turns") || errorMessage.includes("exceeded")) {
                  userMessage += "The plan generation took too long. Try simplifying your requirements: reduce equipment options, increase session time, or adjust your schedule.";
                } else if (errorMessage.includes("validation") || errorMessage.includes("schema")) {
                  userMessage += "There was an issue creating a valid plan structure. Please check your profile settings and try again.";
                } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
                  userMessage += "The request timed out. Please try again in a moment.";
                } else {
                  userMessage += "An unexpected error occurred. Please try again or contact support if the issue persists.";
                }

                sendError(userMessage, errorMessage);
                return;
              }

              // Otherwise, retry
              attemptNumber++;
              console.log("[Plan Generation] Retrying with adjusted parameters...");
              await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay before retry
            }
          }

          if (!aiResult) {
            sendError("Plan generation failed after multiple attempts. Please try again.");
            return;
          }

          console.log("[Plan Generation] AI response received, post-processing...");
          sendProgress('processing', 'Processing your plan...', 75);

          // Post-process response (enforce PCOS guardrails, time budgets)
          const postProcessResult = postProcessPlannerResponse(aiResult.data, {
            hasPcos: userProfile.hasPcos,
            targetMinutesPerSession: userProfile.scheduleMinutesPerSession,
            daysPerWeek: userProfile.scheduleDaysPerWeek,
            noHighImpact: userProfile.noHighImpact,
          });

          if (!postProcessResult.success || !postProcessResult.data) {
            console.error("[Plan Generation] Post-processing failed:", postProcessResult.error);
            sendError(`Post-processing failed: ${postProcessResult.error}`);
            return;
          }

          const plannerResponse = postProcessResult.data;
          const warnings = postProcessResult.warnings || [];

          console.log("[Plan Generation] Post-processing complete. Warnings:", warnings);

          // Generate plan ID
          const planId = createPlanId();

          // Expand planner response to full calendar and workouts
          console.log("[Plan Generation] Expanding microcycle to calendar...");
          sendProgress('building', 'Building your calendar...', 85);

          const { microcycle, calendar, workouts: workoutInstances } = expandPlannerResponse(
            plannerResponse,
            {
              planId,
              userId: user.id,
              weeks: userProfile.scheduleWeeks, // Pass weeks from user profile
              startDate: new Date().toISOString().slice(0, 10), // Default start date (can be changed later)
              preferredDays: userProfile.preferredDays || [],
            }
          );

          console.log(
            `[Plan Generation] Generated ${workoutInstances.length} workout instances across ${calendar.weeks.length} weeks`
          );

          // Save plan to database
          console.log("[Plan Generation] Saving to database...");
          sendProgress('saving', 'Saving your plan...', 95);

          const [createdPlan] = await db
            .insert(plans)
            .values({
              id: planId, // Explicitly set the plan ID
              userId: user.id,
              title: `FitCoach Plan - ${microcycle.weeks} weeks`,
              summary: plannerResponse.summary,
              status: "draft",
              active: false,
              durationWeeks: microcycle.weeks,
              daysPerWeek: microcycle.daysPerWeek,
              minutesPerSession: userProfile.scheduleMinutesPerSession,
              preferredDays: userProfile.preferredDays || [],
              microcycle: microcycle as any,
              calendar: calendar as any,
              plannerVersion: "gpt-4o-agents",
              generatedBy: "planner-agent",
            })
            .returning();

          // Save workout instances
          if (workoutInstances.length > 0) {
            await db.insert(workouts).values(workoutInstances);
          }

          console.log("[Plan Generation] Success! Plan ID:", planId);

          // Send completion
          sendComplete({
            success: true,
            plan: {
              id: createdPlan.id,
              title: createdPlan.title,
              summary: createdPlan.summary,
              weeks: microcycle.weeks,
              daysPerWeek: microcycle.daysPerWeek,
              status: createdPlan.status,
              workoutCount: workoutInstances.length,
            },
            warnings,
            cues: plannerResponse.cues,
          });

      } catch (error) {
        console.error("[Plan Generation] Unexpected error:", error);
        sendError(
          "An unexpected error occurred during plan generation",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
