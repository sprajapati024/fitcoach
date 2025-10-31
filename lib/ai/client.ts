import OpenAI from "openai";
import { serverEnv } from "@/lib/env/server";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: serverEnv.OPENAI_API_KEY,
});

interface CallOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ValidatedCallOptions<T> extends CallOptions {
  schema: z.ZodSchema<T>;
  retryOnInvalid?: boolean;
}

/**
 * Call OpenAI with retry logic for invalid JSON responses
 */
export async function callOpenAIWithValidation<T>({
  systemPrompt,
  userPrompt,
  model,
  temperature = 0.7,
  maxTokens = 2000,
  schema,
  retryOnInvalid = true,
}: ValidatedCallOptions<T>): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const modelToUse = model || serverEnv.OPENAI_MODEL_PLANNER;

  try {
    // First attempt
    // Note: o1/o4/gpt-5 models have different parameter requirements
    const isReasoningModel = modelToUse.includes('o1') || modelToUse.includes('o4') || modelToUse.includes('gpt-5');

    const completionParams: any = {
      model: modelToUse,
      messages: [
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ],
      max_completion_tokens: maxTokens,
    };

    // Only add temperature and response_format for non-reasoning models
    if (!isReasoningModel) {
      completionParams.temperature = temperature;
      completionParams.response_format = { type: "json_object" };
      // Add system message separately for non-reasoning models
      completionParams.messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    }

    const completion = await openai.chat.completions.create(completionParams);

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return { success: false, error: "Empty response from OpenAI" };
    }

    // Parse JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      if (!retryOnInvalid) {
        return { success: false, error: "Invalid JSON response" };
      }
      // Retry with repair instructions
      return retryWithRepair(systemPrompt, userPrompt, responseText, schema, modelToUse, temperature, maxTokens);
    }

    // Validate with schema
    const validationResult = schema.safeParse(jsonData);
    if (validationResult.success) {
      return { success: true, data: validationResult.data };
    }

    // Schema validation failed
    if (!retryOnInvalid) {
      return {
        success: false,
        error: `Schema validation failed: ${validationResult.error.message}`,
      };
    }

    // Retry with repair instructions
    return retryWithRepair(systemPrompt, userPrompt, responseText, schema, modelToUse, temperature, maxTokens);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error calling OpenAI",
    };
  }
}

/**
 * Retry with repair instructions
 */
async function retryWithRepair<T>(
  originalSystemPrompt: string,
  originalUserPrompt: string,
  invalidResponse: string,
  schema: z.ZodSchema<T>,
  model: string,
  temperature: number,
  maxTokens: number
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const repairSystemPrompt = `${originalSystemPrompt}

IMPORTANT: Your previous response was invalid. Please repair it to match the required schema exactly.`;

    const repairUserPrompt = `${originalUserPrompt}

Your previous response was:
${invalidResponse}

This response is invalid. Please provide a corrected JSON response that strictly follows the required schema.`;

    const isReasoningModel = model.includes('o1') || model.includes('o4') || model.includes('gpt-5');

    const retryParams: any = {
      model,
      messages: isReasoningModel
        ? [{ role: "user", content: `${repairSystemPrompt}\n\n${repairUserPrompt}` }]
        : [
            { role: "system", content: repairSystemPrompt },
            { role: "user", content: repairUserPrompt },
          ],
      max_completion_tokens: maxTokens,
    };

    // Only add temperature and response_format for non-reasoning models
    if (!isReasoningModel) {
      retryParams.temperature = temperature;
      retryParams.response_format = { type: "json_object" };
    }

    const retryCompletion = await openai.chat.completions.create(retryParams);

    const retryResponseText = retryCompletion.choices[0]?.message?.content;
    if (!retryResponseText) {
      return { success: false, error: "Empty response from OpenAI on retry" };
    }

    // Parse retry JSON
    let retryJsonData: unknown;
    try {
      retryJsonData = JSON.parse(retryResponseText);
    } catch {
      return { success: false, error: "Invalid JSON response after retry" };
    }

    // Validate retry with schema
    const retryValidationResult = schema.safeParse(retryJsonData);
    if (retryValidationResult.success) {
      return { success: true, data: retryValidationResult.data };
    }

    return {
      success: false,
      error: `Schema validation failed after retry: ${retryValidationResult.error.message}`,
    };
  } catch (error) {
    console.error("OpenAI retry error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error on retry",
    };
  }
}

/**
 * Call OpenAI for planner (structure generation)
 */
export async function callPlanner<T>({
  systemPrompt,
  userPrompt,
  schema,
}: {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
}): Promise<{ success: true; data: T } | { success: false; error: string }> {
  return callOpenAIWithValidation({
    systemPrompt,
    userPrompt,
    model: serverEnv.OPENAI_MODEL_PLANNER,
    temperature: 0.7,
    maxTokens: 3000,
    schema,
    retryOnInvalid: true,
  });
}

/**
 * Call OpenAI for coach (brief, debrief, review, substitution)
 */
export async function callCoach<T>({
  systemPrompt,
  userPrompt,
  schema,
  maxTokens = 500,
}: {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
  maxTokens?: number;
}): Promise<{ success: true; data: T } | { success: false; error: string }> {
  return callOpenAIWithValidation({
    systemPrompt,
    userPrompt,
    model: serverEnv.OPENAI_MODEL_COACH,
    temperature: 0.8,
    maxTokens,
    schema,
    retryOnInvalid: true,
  });
}
