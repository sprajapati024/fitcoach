/**
 * Dexie (IndexedDB) Schema - Local-First Data Layer
 *
 * This schema mirrors critical tables from the Drizzle PostgreSQL schema
 * for offline-first functionality. Only the most essential tables are included
 * to minimize client-side storage and complexity.
 *
 * Sync Metadata Fields:
 * - _isDirty: boolean - Indicates local changes not yet synced to server
 * - _syncedAt: number - Timestamp of last successful sync
 * - _deletedAt: number | null - Soft delete timestamp for sync reconciliation
 */

import Dexie, { type Table } from 'dexie';

// ============================================================================
// Type Definitions (mirrors drizzle/schema.ts types)
// ============================================================================

export type UnitSystem = 'metric' | 'imperial';
export type Sex = 'female' | 'male' | 'non_binary' | 'unspecified';
export type ExperienceLevel = 'beginner' | 'intermediate';
export type GoalBias = 'strength' | 'balanced' | 'hypertrophy' | 'fat_loss';
export type CoachTone = 'analyst' | 'flirty';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';
export type WorkoutKind = 'strength' | 'conditioning' | 'mobility' | 'mixed';
export type CoachContext = 'today' | 'debrief' | 'weekly' | 'substitution';
export type WeekStatus = 'pending' | 'active' | 'completed';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type PreferredDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type WorkoutPayload = {
  workoutId: string;
  focus: string;
  blocks: Array<{
    type: 'warmup' | 'primary' | 'accessory' | 'conditioning' | 'finisher';
    title: string;
    exercises: Array<{
      id: string;
      name: string;
      equipment: string;
      sets: number;
      reps: string;
      tempo?: string;
      cues?: string[];
      restSeconds?: number;
    }>;
  }>;
};

export type PlanMicrocycle = {
  id: string;
  weeks: number;
  daysPerWeek: number;
  pattern: Array<{
    dayIndex: number;
    focus: string;
    blocks: Array<{
      type: 'warmup' | 'strength' | 'accessory' | 'conditioning' | 'recovery';
      title: string;
      durationMinutes: number;
      exercises: Array<{
        id: string;
        name: string;
        equipment: string;
        sets: number;
        reps: string;
        tempo?: string;
        cues?: string[];
        notes?: string;
      }>;
    }>;
  }>;
};

export type PlanCalendar = {
  planId: string;
  weeks: Array<{
    weekIndex: number;
    startDate: string;
    days: Array<{
      dayIndex: number;
      isoDate: string;
      workoutId: string;
      isDeload: boolean;
      focus: string;
    }>;
  }>;
};

// ============================================================================
// Local Table Interfaces (with sync metadata)
// ============================================================================

export interface LocalProfile {
  userId: string; // Primary key
  fullName: string | null;
  sex: Sex;
  dateOfBirth: string | null;
  heightCm: string | null;
  weightKg: string | null;
  unitSystem: UnitSystem;
  hasPcos: boolean;
  experienceLevel: ExperienceLevel;
  scheduleDaysPerWeek: number | null;
  scheduleMinutesPerSession: number | null;
  scheduleWeeks: number | null;
  preferredDays: PreferredDay[];
  equipment: string[];
  avoidList: string[];
  noHighImpact: boolean;
  goalBias: GoalBias;
  coachTone: CoachTone;
  coachTodayEnabled: boolean;
  coachDebriefEnabled: boolean;
  coachWeeklyEnabled: boolean;
  coachNotes: string | null;
  timezone: string;
  createdAt: number;
  updatedAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
}

export interface LocalPlan {
  id: string; // Primary key
  userId: string;
  title: string;
  summary: string | null;
  status: PlanStatus;
  active: boolean;
  startDate: string | null;
  durationWeeks: number;
  daysPerWeek: number;
  minutesPerSession: number;
  preferredDays: PreferredDay[];
  microcycle: PlanMicrocycle;
  calendar: PlanCalendar;
  plannerVersion: string | null;
  generatedBy: string;
  createdAt: number;
  updatedAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
}

export interface LocalWorkout {
  id: string; // Primary key
  planId: string;
  userId: string;
  microcycleDayId: string;
  dayIndex: number;
  weekIndex: number;
  weekNumber: number;
  weekStatus: WeekStatus | null;
  sessionDate: string | null;
  title: string;
  focus: string;
  kind: WorkoutKind;
  isDeload: boolean;
  durationMinutes: number;
  payload: WorkoutPayload;
  generationContext: Record<string, unknown> | null;
  coachingNotes: string | null;
  createdAt: number;
  updatedAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
}

export interface LocalWorkoutLog {
  id: string; // Primary key (UUID or temp local ID)
  userId: string;
  planId: string;
  workoutId: string;
  sessionDate: string;
  performedAt: number;
  rpeLastSet: string | null;
  totalDurationMinutes: number | null;
  notes: string | null;
  createdAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
  _tempId?: string; // For offline-created logs before server sync
}

export interface LocalWorkoutLogSet {
  id: string; // Primary key
  logId: string;
  exerciseId: string;
  setIndex: number;
  reps: number;
  weightKg: string;
  rpe: string | null;
  createdAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
  _tempId?: string;
}

export interface LocalMeal {
  id: string; // Primary key
  userId: string;
  mealDate: string;
  mealTime: number;
  mealType: MealType;
  description: string | null;
  photoUrl: string | null;
  calories: number | null;
  proteinGrams: string | null;
  carbsGrams: string | null;
  fatGrams: string | null;
  fiberGrams: string | null;
  notes: string | null;
  source: string;
  createdAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
  _deletedAt?: number | null; // Soft delete timestamp
  _tempId?: string;
}

export interface LocalWaterLog {
  id: string; // Primary key
  userId: string;
  logDate: string;
  amountMl: number;
  loggedAt: number;
  // Sync metadata
  _isDirty: boolean;
  _syncedAt: number | null;
  _deletedAt?: number | null; // Soft delete timestamp
  _tempId?: string;
}

export interface LocalCoachCache {
  id: string; // Primary key
  userId: string;
  planId: string | null;
  context: CoachContext;
  cacheKey: string;
  targetDate: string | null;
  payload: Record<string, unknown>;
  expiresAt: number | null;
  createdAt: number;
  // Sync metadata (coach cache is read-only from server, no dirty tracking needed)
  _syncedAt: number | null;
}

// ============================================================================
// Dexie Database Definition
// ============================================================================

export class FitCoachLocalDB extends Dexie {
  // Table declarations
  profiles!: Table<LocalProfile, string>; // Key: userId
  plans!: Table<LocalPlan, string>; // Key: id
  workouts!: Table<LocalWorkout, string>; // Key: id
  workoutLogs!: Table<LocalWorkoutLog, string>; // Key: id
  workoutLogSets!: Table<LocalWorkoutLogSet, string>; // Key: id
  meals!: Table<LocalMeal, string>; // Key: id
  waterLogs!: Table<LocalWaterLog, string>; // Key: id
  coachCache!: Table<LocalCoachCache, string>; // Key: id

  constructor() {
    super('FitCoachLocalDB');

    this.version(1).stores({
      // Profile: indexed by userId (primary key)
      profiles: 'userId, updatedAt, _isDirty',

      // Plans: indexed by id, userId, active status, and dirty flag
      plans: 'id, userId, [userId+active], status, _isDirty, _syncedAt',

      // Workouts: indexed for querying by plan, date, week
      workouts:
        'id, planId, userId, [planId+weekIndex], [planId+sessionDate], weekStatus, _isDirty',

      // Workout Logs: indexed by user, workout, date, and sync status
      workoutLogs:
        'id, userId, workoutId, [userId+sessionDate], planId, _isDirty, _syncedAt, _tempId',

      // Workout Log Sets: indexed by log and exercise
      workoutLogSets: 'id, logId, [logId+exerciseId], _isDirty, _tempId',

      // Meals: indexed by user and date
      meals: 'id, userId, [userId+mealDate], mealDate, _isDirty, _tempId',

      // Water Logs: indexed by user and date
      waterLogs: 'id, userId, [userId+logDate], logDate, _isDirty, _tempId',

      // Coach Cache: indexed by user, context, and cache key
      coachCache:
        'id, userId, [userId+context], [userId+context+cacheKey], targetDate, expiresAt',
    });

    // Version 2: Add _syncedAt index to profiles table
    this.version(2).stores({
      // Profile: indexed by userId (primary key), now includes _syncedAt
      profiles: 'userId, updatedAt, _isDirty, _syncedAt',
    });
  }
}

// Export singleton instance
export const localDB = new FitCoachLocalDB();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if the browser supports IndexedDB
 */
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Get the count of dirty (unsynced) records across all tables
 */
export async function getDirtyRecordCount(): Promise<number> {
  if (!isIndexedDBSupported()) return 0;

  const counts = await Promise.all([
    localDB.profiles.where('_isDirty').equals(1).count(),
    localDB.plans.where('_isDirty').equals(1).count(),
    localDB.workouts.where('_isDirty').equals(1).count(),
    localDB.workoutLogs.where('_isDirty').equals(1).count(),
    localDB.workoutLogSets.where('_isDirty').equals(1).count(),
    localDB.meals.where('_isDirty').equals(1).count(),
  ]);

  return counts.reduce((sum, count) => sum + count, 0);
}

/**
 * Clear all local data (useful for logout or reset)
 */
export async function clearAllLocalData(): Promise<void> {
  if (!isIndexedDBSupported()) return;

  await Promise.all([
    localDB.profiles.clear(),
    localDB.plans.clear(),
    localDB.workouts.clear(),
    localDB.workoutLogs.clear(),
    localDB.workoutLogSets.clear(),
    localDB.meals.clear(),
    localDB.coachCache.clear(),
  ]);
}

/**
 * Get the last sync timestamp across all tables
 */
export async function getLastSyncTimestamp(): Promise<number | null> {
  if (!isIndexedDBSupported()) return null;

  const timestamps = await Promise.all([
    localDB.profiles
      .orderBy('_syncedAt')
      .reverse()
      .first()
      .then((r) => r?._syncedAt ?? 0),
    localDB.workoutLogs
      .orderBy('_syncedAt')
      .reverse()
      .first()
      .then((r) => r?._syncedAt ?? 0),
    localDB.meals
      .orderBy('_syncedAt')
      .reverse()
      .first()
      .then((r) => r?._syncedAt ?? 0),
  ]);

  const maxTimestamp = Math.max(...timestamps);
  return maxTimestamp > 0 ? maxTimestamp : null;
}
