export const plannerSystemPrompt = `You are FitCoach Planner, a concise strength coach who designs structured micro-cycles for a monochrome PWA. You must:
- Output compact JSON only.
- Never assign training loads or weights. The app computes load progression.
- Respect PCOS guardrails: provide at least two steady-state Zone 2 sessions per week, avoid high-impact plyometrics (no bounding/jumps) and limit intense intervals to <= 60s.
- Keep cues short (<= 10 words) and no more than 4 cues per exercise.
- Design 6-16 week programs with 3-6 sessions/week and 40-90 minute durations.
- Maintain deterministic structure: do not reshuffle previous weeks.`;

export const coachSystemPrompt = `You are FitCoach Coach. You provide short actionable nudges for daily briefings, post-workout debriefs, and weekly reviews. Stay concise (<= 60 words total). Use monochrome-friendly language (no emoji). Reinforce safety, PCOS guardrails, and positive adherence. Never mention training loads.`;

export const substitutionSystemPrompt = `You are FitCoach Substitutions. Suggest 2-3 alternative exercises targeting the same pattern and muscle group. All alternatives must exist in the canonical FitCoach catalog. Prefer low-impact, PCOS-friendly options. Return JSON with fields: alternatives:[{exerciseId, rationale}]`;

// ============================================================================
// Phase 3: Adaptive Planning Prompt Templates
// ============================================================================

/**
 * Initial week prompt template (Week 1 generation)
 * Used when creating the first week of a training plan
 */
export function initialWeekPromptTemplate(userContext: {
  experience: "beginner" | "intermediate" | "advanced";
  hasPcos: boolean;
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: string[];
  avoidList: string[];
  noHighImpact: boolean;
}): string {
  const pcosNote = userContext.hasPcos
    ? "CRITICAL: User has PCOS. Include at least 2 steady-state Zone 2 cardio sessions per week. Avoid high-impact plyometrics (no bounding/jumps). Limit intense intervals to <= 60 seconds."
    : "";

  const experienceNote = {
    beginner: "Conservative progression. Focus on movement quality and building base fitness. Start with moderate RPE 6-7.",
    intermediate: "Balanced progression. Assume good movement literacy. Target RPE 7-8 on primary lifts.",
    advanced: "Aggressive progression. Athlete can handle higher volumes. Target RPE 8-9 on primary lifts.",
  }[userContext.experience];

  return `Generate Week 1 of a structured training program.

**User Profile:**
- Experience: ${userContext.experience}
- Training frequency: ${userContext.daysPerWeek} days/week
- Session duration: ${userContext.minutesPerSession} minutes
- Available equipment: ${userContext.equipment.join(", ")}
- Avoid: ${userContext.avoidList.length > 0 ? userContext.avoidList.join(", ") : "None"}
${pcosNote}

**Week 1 Guidelines:**
- This is the ACCUMULATION phase (building volume foundation)
- ${experienceNote}
- Include warm-up, primary strength work, accessory work, and optional conditioning
- Assign targetRPE for each exercise (6-9 range based on experience)
- Provide progressionNotes for each exercise explaining how to progress in subsequent weeks
- Keep cues short (<= 10 words) and actionable

**Output Format:**
Return JSON matching adaptiveWeekResponseSchema with:
- weekNumber: 1
- phase: "accumulation"
- workouts: array of ${userContext.daysPerWeek} workouts with blocks and exercises
- summary: Brief overview of Week 1 focus
- progressionRationale: How this week sets foundation for future progression
- cues: 3-5 key coaching points for the week`;
}

/**
 * Subsequent week prompt template (Week 2+)
 * Used when generating next week based on previous week performance
 */
export function subsequentWeekPromptTemplate(
  weekNumber: number,
  phase: "accumulation" | "intensification" | "deload" | "realization",
  previousWeekData: {
    workouts: Array<{
      focus: string;
      completedSets: number;
      targetSets: number;
      avgRPE: number;
      notes?: string;
    }>;
    overallAdherence: number; // 0-1 (percentage of completed workouts)
    avgRPEAcrossWeek: number;
    userFeedback?: string;
  },
  userContext: {
    experience: "beginner" | "intermediate" | "advanced";
    hasPcos: boolean;
    daysPerWeek: number;
    minutesPerSession: number;
  }
): string {
  const phaseGuidelines = {
    accumulation: "Continue building volume. Maintain moderate intensity (RPE 7-8). Focus on movement quality and consistency.",
    intensification: "Increase intensity (RPE 8-9) while maintaining or slightly reducing volume. Prepare for peak performance.",
    deload: "RECOVERY WEEK. Reduce volume by 30-40% and intensity to RPE 6-7. Maintain movement patterns but allow recovery.",
    realization: "PEAK WEEK. Test strength gains with challenging loads (RPE 9-10). Minimal volume, maximum expression of fitness.",
  }[phase];

  const adherenceNote =
    previousWeekData.overallAdherence < 0.75
      ? "Note: User completed less than 75% of last week. Consider maintaining or reducing volume this week."
      : previousWeekData.overallAdherence === 1
      ? "Note: User completed all workouts last week. They're ready for progressive overload."
      : "";

  const rpeNote =
    previousWeekData.avgRPEAcrossWeek > 8.5
      ? "Note: User reported high RPE last week (>8.5). Consider backing off volume/intensity slightly to prevent overreaching."
      : previousWeekData.avgRPEAcrossWeek < 7
      ? "Note: User reported low RPE last week (<7). Consider increasing intensity or volume."
      : "";

  return `Generate Week ${weekNumber} of the training program based on Week ${weekNumber - 1} performance.

**Current Phase:** ${phase.toUpperCase()}
${phaseGuidelines}

**Previous Week Performance:**
- Adherence: ${(previousWeekData.overallAdherence * 100).toFixed(0)}% (${previousWeekData.workouts.filter(w => w.completedSets / w.targetSets >= 0.8).length}/${previousWeekData.workouts.length} workouts completed)
- Average RPE: ${previousWeekData.avgRPEAcrossWeek.toFixed(1)}
${adherenceNote}
${rpeNote}
${previousWeekData.userFeedback ? `- User feedback: "${previousWeekData.userFeedback}"` : ""}

**Workout Details from Previous Week:**
${previousWeekData.workouts.map((w, i) => `
Day ${i + 1} (${w.focus}):
  - Completed: ${w.completedSets}/${w.targetSets} sets
  - Avg RPE: ${w.avgRPE.toFixed(1)}
  ${w.notes ? `- Notes: ${w.notes}` : ""}
`).join("")}

**Week ${weekNumber} Guidelines:**
- Adjust volume/intensity based on previous week performance
- If adherence was low, maintain or reduce difficulty
- If adherence was high and RPE was appropriate, apply progressive overload
- Maintain exercise selection consistency (only substitute if user struggled with movements)
- Update targetRPE based on ${phase} phase guidelines
- Provide specific progressionNotes explaining changes from last week

**Output Format:**
Return JSON matching adaptiveWeekResponseSchema with:
- weekNumber: ${weekNumber}
- phase: "${phase}"
- workouts: array of ${userContext.daysPerWeek} workouts
- summary: Brief overview of Week ${weekNumber} focus
- progressionRationale: Specific explanation of how/why you progressed from Week ${weekNumber - 1}
- cues: 3-5 key coaching points for this week`;
}

/**
 * Phase-specific guidelines for AI planner
 */
export const phaseGuidelines = {
  accumulation: `
ACCUMULATION PHASE (Weeks 1-3)
- Primary goal: Build work capacity and movement quality
- Volume: HIGH (3-4 sets per exercise)
- Intensity: MODERATE (RPE 7-8)
- Focus: Technical proficiency, time under tension
- Progression: Add reps or sets before increasing weight
- Recovery: Standard rest periods (90-120s for compounds)
`,
  intensification: `
INTENSIFICATION PHASE (Weeks 4-6)
- Primary goal: Build maximal strength
- Volume: MODERATE (3-5 sets per exercise, but fewer reps)
- Intensity: HIGH (RPE 8-9)
- Focus: Heavy loads, explosive intent
- Progression: Increase weight while maintaining reps
- Recovery: Longer rest periods (2-3 min for compounds)
`,
  deload: `
DELOAD PHASE (Week 3 or Week 7)
- Primary goal: Recovery and supercompensation
- Volume: LOW (reduce by 30-40%)
- Intensity: LOW-MODERATE (RPE 6-7)
- Focus: Movement quality, active recovery
- Progression: None - maintain movement patterns
- Recovery: Focus on sleep, nutrition, stress management
`,
  realization: `
REALIZATION PHASE (Weeks 7-8 of 8-week block)
- Primary goal: Test strength gains and peak performance
- Volume: LOW (2-3 sets per exercise)
- Intensity: VERY HIGH (RPE 9-10)
- Focus: Maximum expression of strength adaptations
- Progression: Test 1-3RM or high-RPE work
- Recovery: Extended rest, full CNS recovery between sets
`,
};

/**
 * Experience-level specific coaching guidelines
 */
export const experienceGuidelines = {
  beginner: `
BEGINNER ATHLETE GUIDELINES:
- Prioritize movement quality over load
- Start conservative (RPE 6-7), progress slowly
- Focus on compound movements with simple cues
- Allow 2-3 days between similar muscle groups
- Include technique primers in warm-ups
- Expect rapid "newbie gains" - add weight/reps weekly
- Monitor for delayed onset soreness (DOMS)
- Emphasize consistency over intensity
`,
  intermediate: `
INTERMEDIATE ATHLETE GUIDELINES:
- Assume good movement literacy and work capacity
- Target RPE 7-8 on primary lifts
- Can handle moderate training density
- Progress via volume (sets/reps) and intensity (weight)
- Include variation (tempo, pauses, etc.) for stimulus
- Allow 1-2 days between similar muscle groups
- Periodize intensity across weeks (undulating or block)
- Monitor for overreaching signs
`,
  advanced: `
ADVANCED ATHLETE GUIDELINES:
- Expect high training tolerance and recovery capacity
- Target RPE 8-9+ on primary lifts
- Can handle high training density and volume
- Use advanced periodization (blocks, daily undulating)
- Include specialty work (accommodating resistance, clusters)
- Minimal recovery time needed between sessions
- Progression may be slower - focus on small increments
- Monitor for overtraining and systemic fatigue
`,
};
