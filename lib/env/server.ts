import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL_PLANNER: z.string().default("o4-mini"),
  OPENAI_MODEL_COACH: z.string().default("o4-mini"),
  AI_COACH_DEFAULT: z.enum(["on", "off"]).default("on"),
  RAPIDAPI_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;

export const serverEnv: ServerEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL_PLANNER: process.env.OPENAI_MODEL_PLANNER ?? "o4-mini",
  OPENAI_MODEL_COACH: process.env.OPENAI_MODEL_COACH ?? "o4-mini",
  AI_COACH_DEFAULT: (process.env.AI_COACH_DEFAULT as "on" | "off" | undefined) ?? "on",
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
});
