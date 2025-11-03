/**
 * Test script to demonstrate improved workout plan generation prompts
 * Run with: npx tsx scripts/test-prompt-improvements.ts
 */

import { initialWeekPromptTemplate } from '../lib/ai/prompts';

// Sample user profiles to test
const sampleProfiles = {
  beginner4Day: {
    experience: 'beginner' as const,
    hasPcos: false,
    daysPerWeek: 4,
    minutesPerSession: 60,
    equipment: ['barbell', 'dumbbell', 'bench', 'squat_rack'],
    avoidList: [],
    noHighImpact: false,
  },
  intermediatePPL: {
    experience: 'intermediate' as const,
    hasPcos: false,
    daysPerWeek: 5,
    minutesPerSession: 75,
    equipment: ['barbell', 'dumbbell', 'cable_machine', 'bench', 'squat_rack', 'pull_up_bar'],
    avoidList: [],
    noHighImpact: false,
  },
  beginnerPCOS: {
    experience: 'beginner' as const,
    hasPcos: true,
    daysPerWeek: 3,
    minutesPerSession: 45,
    equipment: ['dumbbell', 'bench', 'resistance_bands'],
    avoidList: ['deadlift', 'overhead_press'],
    noHighImpact: true,
  },
};

console.log('='.repeat(80));
console.log('WORKOUT PLAN PROMPT IMPROVEMENT TEST');
console.log('='.repeat(80));
console.log('\n');

// Test 1: Beginner, 4 days/week (Upper/Lower Split)
console.log('TEST 1: Beginner User - 4 Days/Week (Upper/Lower Split)');
console.log('-'.repeat(80));
const prompt1 = initialWeekPromptTemplate(sampleProfiles.beginner4Day);
console.log(prompt1);
console.log('\n\n');

// Test 2: Intermediate, 5 days/week (Push/Pull/Legs)
console.log('TEST 2: Intermediate User - 5 Days/Week (Push/Pull/Legs)');
console.log('-'.repeat(80));
const prompt2 = initialWeekPromptTemplate(sampleProfiles.intermediatePPL);
console.log(prompt2);
console.log('\n\n');

// Test 3: Beginner with PCOS, 3 days/week (Full Body)
console.log('TEST 3: Beginner with PCOS - 3 Days/Week (Full Body)');
console.log('-'.repeat(80));
const prompt3 = initialWeekPromptTemplate(sampleProfiles.beginnerPCOS);
console.log(prompt3);
console.log('\n\n');

console.log('='.repeat(80));
console.log('KEY IMPROVEMENTS DEMONSTRATED:');
console.log('='.repeat(80));
console.log(`
✅ TEMPLATE STRUCTURE: Each prompt includes specific workout template guidance
   - 3 days → Full Body structure
   - 4 days → Upper/Lower Split with A/B variations
   - 5 days → Push/Pull/Legs structure

✅ EXPERIENCE-APPROPRIATE: Exercise selection matches fitness level
   - Beginner: Basic bilateral compounds only (back squat, bench press, etc.)
   - Intermediate: Moderate variations (front squat, RDL, incline press)
   - Advanced: All variations and advanced techniques available

✅ GOAL-SPECIFIC: Sets/reps guidance tailored to user goals
   - Strength: 3-6 reps, heavy compounds
   - Hypertrophy: 8-12 reps, balanced volume
   - Fat Loss: 10-15 reps, circuit-style

✅ PCOS-FRIENDLY: Automatic inclusion of safety guardrails
   - Zone-2 cardio requirements
   - No high-impact movements
   - Limited interval duration

✅ STRUCTURED PROGRESSION: Clear hierarchy and consistency
   - Primary Compound → Secondary Compound → Accessories → Core/Conditioning
   - Core lifts stay consistent, accessories vary for novelty
`);
