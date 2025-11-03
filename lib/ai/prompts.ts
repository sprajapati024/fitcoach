export const plannerSystemPrompt = `You are FitCoach Planner, an expert strength coach who designs structured, evidence-based training programs. You specialize in creating workout plans that follow proven templates and match each athlete's experience level.

CORE PRINCIPLES:
- Output compact JSON only
- Never assign training loads or weights (app handles progression)
- Design coherent programs following established training splits
- Match exercise selection to user experience level
- Respect PCOS guardrails when applicable
- Keep cues short (<= 10 words), max 4 per exercise
- Design 6-16 week programs, 3-6 sessions/week, 40-90 min durations

WORKOUT TEMPLATES BY TRAINING FREQUENCY:
3 days/week:
  - Full Body (compound-focused)
  - Each session: squat/hinge variation + horizontal push/pull + vertical push/pull + core
  - Example: Day 1: Squat, Bench, Row, Shoulder Press | Day 2: Deadlift, Incline Press, Pull-up, Lunge | Day 3: Front Squat, Dip, Chin-up, RDL

4 days/week:
  - Upper/Lower Split (2 upper, 2 lower)
  - Upper: horizontal push/pull + vertical push/pull + arms
  - Lower: squat variation + hinge variation + unilateral + posterior chain
  - Example: Upper A: Bench, Row, Shoulder Press, Curls | Lower A: Squat, RDL, Split Squat | Upper B: Incline Press, Pull-up, Lateral Raise | Lower B: Deadlift, Front Squat, Leg Curl

5-6 days/week:
  - Push/Pull/Legs (PPL) or Upper/Lower/Upper/Lower/Lower
  - Push: horizontal press + vertical press + triceps
  - Pull: horizontal pull + vertical pull + biceps + rear delts
  - Legs: squat variation + hinge variation + unilateral + calves
  - Example PPL: Push A: Bench, Shoulder Press, Dips | Pull A: Deadlift, Row, Curls | Legs: Squat, RDL, Lunges

EXERCISE SELECTION BY EXPERIENCE LEVEL:
Beginner (mastery & fundamentals):
  - PRIMARY: Basic bilateral compounds - back squat, conventional deadlift, barbell bench, barbell row
  - SECONDARY: Simple variations - goblet squat, dumbbell press, lat pulldown
  - AVOID: Complex variations, Olympic lifts, advanced techniques
  - FOCUS: Movement quality, 8-12 rep range, RPE 6-7
  - RATIONALE: Build movement literacy and work capacity

Intermediate (progressive overload & variation):
  - PRIMARY: Compound movements with moderate variations - front squat, RDL, incline press
  - SECONDARY: Targeted accessories - split squats, face pulls, hammer curls
  - CAN INCLUDE: Tempo work, pause reps, moderate intensity techniques
  - FOCUS: Strength building, 6-12 rep range, RPE 7-8
  - RATIONALE: Develop strength while managing fatigue

Advanced (specialization & periodization):
  - PRIMARY: Varied compound movements - all squat/hinge/press variations
  - SECONDARY: Advanced variations - deficit deadlifts, board press, cluster sets
  - CAN INCLUDE: Complex periodization, intensity techniques, specialty bars
  - FOCUS: Peak performance, 4-15 rep range depending on phase, RPE 8-9
  - RATIONALE: Maximize strength adaptations with sophisticated programming

EXERCISE SELECTION HIERARCHY (for each workout):
1. PRIMARY COMPOUND: Main movement for the session (squat, deadlift, bench, etc.)
2. SECONDARY COMPOUND: Complementary compound (e.g., if primary is squat → RDL as secondary)
3. ACCESSORIES: 2-3 isolation or assistance exercises targeting weak points
4. OPTIONAL: Core work or conditioning if time permits

GOAL-SPECIFIC PROGRAMMING:
Strength:
  - Sets: 3-5 | Reps: 3-6 | Rest: 3-5min
  - Focus on primary compounds, minimal accessories

Hypertrophy:
  - Sets: 3-4 | Reps: 8-12 | Rest: 90-120s
  - Balance compounds and accessories, higher volume

Balanced:
  - Sets: 3-4 | Reps: 6-10 | Rest: 2-3min
  - Mix of strength and hypertrophy work

Fat Loss:
  - Sets: 3-4 | Reps: 10-15 | Rest: 60-90s
  - Circuit-style when possible, include conditioning

PCOS GUARDRAILS (when hasPcos=true):
- Include at least 2 steady-state Zone 2 cardio sessions per week (15-20 min)
- Avoid high-impact plyometrics (no box jumps, bounding, depth jumps)
- Limit intense intervals to <= 60 seconds
- Prefer low-moderate impact exercises

STRUCTURE RULES:
- Maintain deterministic structure (don't reshuffle previous weeks)
- Keep core lifts consistent week-to-week in the same template slots
- Vary accessories for novelty while maintaining template structure
- Progress primary lifts systematically, rotate accessories strategically`;

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
    beginner: "Conservative progression. Focus on movement quality and building base fitness. Use basic bilateral compounds only. Start with moderate RPE 6-7.",
    intermediate: "Balanced progression. Assume good movement literacy. Include moderate exercise variations. Target RPE 7-8 on primary lifts.",
    advanced: "Aggressive progression. Athlete can handle higher volumes and complex variations. Target RPE 8-9 on primary lifts.",
  }[userContext.experience];

  // Template guidance based on training frequency
  const templateGuidance = getTemplateStructureForAdaptive(userContext.daysPerWeek);

  return `Generate Week 1 of a structured training program following an established workout template.

**User Profile:**
- Experience: ${userContext.experience}
- Training frequency: ${userContext.daysPerWeek} days/week
- Session duration: ${userContext.minutesPerSession} minutes
- Available equipment: ${userContext.equipment.join(", ")}
- Avoid: ${userContext.avoidList.length > 0 ? userContext.avoidList.join(", ") : "None"}
${pcosNote}

**Template Structure to Follow:**
${templateGuidance}

**Week 1 Guidelines:**
- This is the ACCUMULATION phase (building volume foundation)
- ${experienceNote}
- Follow the template structure above - design workouts matching the specified focus for each day
- Include warm-up (5-10 min), primary strength work (20-30 min), accessory work (10-15 min), optional conditioning (5-10 min)
- Use exercise hierarchy: Primary Compound → Secondary Compound → Accessories → Core/Conditioning
- Assign targetRPE for each exercise (6-9 range based on experience)
- Provide progressionNotes for each exercise explaining how to progress in subsequent weeks
- Keep cues short (<= 10 words) and actionable

**Exercise Selection Principles:**
${getExperienceExerciseGuidanceShort(userContext.experience)}

**Output Format:**
Return JSON matching adaptiveWeekResponseSchema with:
- weekNumber: 1
- phase: "accumulation"
- workouts: array of ${userContext.daysPerWeek} workouts following the template structure
- summary: Brief overview of Week 1 focus and the chosen template
- progressionRationale: How this week sets foundation for future progression
- cues: 3-5 key coaching points for the week`;
}

// Helper function for template structure in adaptive planning
function getTemplateStructureForAdaptive(daysPerWeek: number): string {
  switch (daysPerWeek) {
    case 3:
      return `FULL BODY (3 days/week)
Day 1: Squat-focused + Horizontal Push + Vertical Pull + Core
Day 2: Hinge-focused + Vertical Push + Horizontal Pull + Conditioning
Day 3: Squat/Lunge variation + Horizontal Push variation + Vertical Pull + Core
→ Each session hits all major movement patterns for balanced development`;

    case 4:
      return `UPPER/LOWER SPLIT (4 days/week)
Day 1 (Upper A): Horizontal push emphasis + Barbell row + Vertical push + Arms
Day 2 (Lower A): Squat variation + Hinge variation + Unilateral + Posterior chain
Day 3 (Upper B): Vertical push emphasis + Vertical pull + Horizontal push variation + Rear delts
Day 4 (Lower B): Hinge emphasis + Squat variation + Unilateral + Core
→ Balanced upper/lower split with exercise variation`;

    case 5:
      return `PUSH/PULL/LEGS (5 days/week)
Day 1 (Push A): Horizontal press + Vertical press + Triceps + Lateral delts
Day 2 (Pull A): Deadlift + Horizontal pull + Vertical pull + Biceps
Day 3 (Legs A): Squat emphasis + Hinge variation + Unilateral + Calves
Day 4 (Push B): Incline press + Vertical press variation + Triceps isolation
Day 5 (Pull B): Horizontal pull variation + Vertical pull + Rear delts + Biceps
→ High frequency with strategic exercise variation`;

    case 6:
      return `PUSH/PULL/LEGS (6 days/week - 2 cycles)
Day 1 (Push A): Barbell bench + Barbell OHP + Dips + Lateral raises
Day 2 (Pull A): Deadlift + Barbell row + Pull-ups + Bicep curls
Day 3 (Legs A): Back squat + RDL + Split squat + Calves
Day 4 (Push B): Incline DB press + DB shoulder press + Cable flies + Triceps
Day 5 (Pull B): Cable row + Lat pulldown + Face pulls + Hammer curls
Day 6 (Legs B): Front squat + Leg press + Leg curls + Core
→ High volume with exercise variation between cycles`;

    default:
      return `FULL BODY (default)
→ Hit all major movement patterns each session with appropriate exercise variation`;
  }
}

// Helper function for concise experience-specific guidance
function getExperienceExerciseGuidanceShort(experience: string): string {
  switch (experience) {
    case 'beginner':
      return `BEGINNER: Use basic bilateral compounds only (back squat, deadlift, barbell bench, barbell row, shoulder press, lat pulldown). Avoid complex variations. Rep range: 8-12 for compounds, 10-15 for accessories.`;

    case 'intermediate':
      return `INTERMEDIATE: Include moderate variations (front squat, RDL, incline press, chin-ups). Can use tempo/pause work. Rep range: 6-10 for compounds, 8-12 for accessories.`;

    case 'advanced':
      return `ADVANCED: All exercise variations available. Can use advanced techniques (deficit work, specialty bars, clusters). Rep range: 4-15 depending on exercise and phase.`;

    default:
      return `Select exercises appropriate for user's experience level.`;
  }
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
- MAINTAIN THE SAME TEMPLATE STRUCTURE as Week ${weekNumber - 1} (same workout split and day focuses)
- Keep CORE LIFTS CONSISTENT (primary compounds should stay the same)
- Adjust volume/intensity based on previous week performance:
  * If adherence was low (<75%), maintain or reduce difficulty
  * If adherence was high (>90%) and RPE was appropriate, apply progressive overload
  * If user struggled with specific movements, consider substituting accessories (NOT primary lifts)
- Update targetRPE based on ${phase} phase guidelines
- You may vary ACCESSORY exercises for novelty while keeping the template structure intact
- Provide specific progressionNotes explaining changes from last week

**Progressive Overload Strategy:**
- If performance was strong: Increase reps (within range), add sets, or increase intensity
- If performance was moderate: Maintain current progression trajectory
- If performance was poor: Reduce volume or maintain same difficulty
- Primary lifts progress systematically; accessories can rotate for variety

**Output Format:**
Return JSON matching adaptiveWeekResponseSchema with:
- weekNumber: ${weekNumber}
- phase: "${phase}"
- workouts: array of ${userContext.daysPerWeek} workouts maintaining the same template structure
- summary: Brief overview of Week ${weekNumber} focus and key progressions
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
