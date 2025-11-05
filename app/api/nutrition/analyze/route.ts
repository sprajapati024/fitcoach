import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyzeMealRequestSchema, analyzeMealResponseSchema } from "@/lib/nutritionValidation";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/nutrition/analyze
 * Analyze a meal description and estimate nutrition info using AI
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealDescription } = analyzeMealRequestSchema.parse(body);

    // Use OpenAI to analyze the meal
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a nutrition analysis assistant. Analyze meal descriptions and provide detailed nutritional estimates.

Your response MUST be a valid JSON object with this exact structure:
{
  "estimatedNutrition": {
    "calories": <number>,
    "proteinGrams": <number>,
    "carbsGrams": <number>,
    "fatGrams": <number>,
    "fiberGrams": <number>
  },
  "breakdown": [
    "Item 1: ~XXX cal, XXg protein, XXg carbs, XXg fat",
    "Item 2: ~XXX cal, XXg protein, XXg carbs, XXg fat"
  ],
  "suggestion": "Brief helpful tip (optional)"
}

Guidelines:
- Be specific but reasonable with portion sizes
- Use standard serving sizes when not specified
- Include all macronutrients
- Breakdown should list each food item with its estimated nutrition
- Suggestion can include tips for balance, nutrient density, or PCOS-friendly adjustments
- Keep suggestions brief (1-2 sentences max)
- Return ONLY the JSON object, no markdown formatting`,
        },
        {
          role: "user",
          content: `Analyze this meal and estimate its nutrition:\n\n${mealDescription}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysisText = completion.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error("No response from AI");
    }

    // Parse and validate the AI response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
      analyzeMealResponseSchema.parse(analysis); // Validate structure
    } catch (parseError) {
      console.error("Invalid AI response format:", parseError);
      console.error("AI response:", analysisText);
      throw new Error("AI returned invalid response format");
    }

    return NextResponse.json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    console.error("Error analyzing meal:", error);

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid meal description", details: error },
          { status: 400 },
        );
      }
      if (error.message.includes("AI returned invalid response")) {
        return NextResponse.json(
          {
            error: "AI analysis failed",
            message: "Could not analyze meal. Please try again or enter nutrition manually.",
          },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to analyze meal",
        message: "Please try again or enter nutrition information manually",
      },
      { status: 500 },
    );
  }
}
