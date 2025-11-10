/**
 * Unified Local-First Data Access Layer
 *
 * This module provides a single interface for reading and writing data
 * with offline-first semantics:
 *
 * 1. Read Path: IndexedDB → API fallback
 * 2. Write Path: IndexedDB (mark dirty) → Queue for sync
 *
 * Usage:
 *   - Call `localData.getWorkout(id)` instead of direct API fetch
 *   - Call `localData.saveWorkoutLog(data)` to save offline-capable logs
 *   - The sync engine (Phase 4) will handle pushing dirty records to server
 */

import { v4 as uuidv4 } from 'uuid';
import {
  localDB,
  isIndexedDBSupported,
  type LocalWorkout,
  type LocalWorkoutLog,
  type LocalWorkoutLogSet,
  type LocalMeal,
  type LocalProfile,
  type LocalPlan,
  type LocalCoachCache,
  type Sex,
  type UnitSystem,
  type ExperienceLevel,
  type GoalBias,
  type CoachTone,
  type PlanStatus,
  type WorkoutKind,
  type MealType,
  type WeekStatus,
  type PreferredDay,
  type WorkoutPayload,
  type PlanMicrocycle,
  type PlanCalendar,
} from './schema.local';

// ============================================================================
// Network Detection
// ============================================================================

export function isOnline(): boolean {
  if (typeof window === 'undefined') return true; // SSR = assume online
  return navigator.onLine;
}

// ============================================================================
// Profile Operations
// ============================================================================

export async function getProfile(userId: string): Promise<LocalProfile | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const cached = await localDB.profiles.get(userId);
    if (cached) return cached;

    // If online, fetch from API and cache
    if (isOnline()) {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const serverProfile = await response.json();
        const local = mapServerProfileToLocal(serverProfile);
        await localDB.profiles.put(local);
        return local;
      }
    }

    return null;
  } catch (error) {
    console.error('[localData] getProfile error:', error);
    return null;
  }
}

export async function saveProfile(profile: Partial<LocalProfile>): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const existing = profile.userId ? await localDB.profiles.get(profile.userId) : null;

    const updated: LocalProfile = {
      ...(existing || {}),
      ...profile,
      updatedAt: Date.now(),
      _isDirty: true,
      _syncedAt: existing?._syncedAt ?? null,
    } as LocalProfile;

    await localDB.profiles.put(updated);
  } catch (error) {
    console.error('[localData] saveProfile error:', error);
    throw error;
  }
}

// ============================================================================
// Plan Operations
// ============================================================================

export async function getActivePlan(userId: string): Promise<LocalPlan | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    // Try local cache first
    const cached = await localDB.plans
      .where('userId')
      .equals(userId)
      .and((plan) => plan.active === true)
      .first();

    if (cached) return cached;

    // If online, fetch from API
    if (isOnline()) {
      const response = await fetch(`/api/plan/active?userId=${userId}`);
      if (response.ok) {
        const serverPlan = await response.json();
        const local = mapServerPlanToLocal(serverPlan);
        await localDB.plans.put(local);
        return local;
      }
    }

    return null;
  } catch (error) {
    console.error('[localData] getActivePlan error:', error);
    return null;
  }
}

export async function getPlan(planId: string): Promise<LocalPlan | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const cached = await localDB.plans.get(planId);
    if (cached) return cached;

    if (isOnline()) {
      const response = await fetch(`/api/plan/${planId}`);
      if (response.ok) {
        const serverPlan = await response.json();
        const local = mapServerPlanToLocal(serverPlan);
        await localDB.plans.put(local);
        return local;
      }
    }

    return null;
  } catch (error) {
    console.error('[localData] getPlan error:', error);
    return null;
  }
}

// ============================================================================
// Workout Operations
// ============================================================================

export async function getWorkout(workoutId: string): Promise<LocalWorkout | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const cached = await localDB.workouts.get(workoutId);
    if (cached) return cached;

    if (isOnline()) {
      const response = await fetch(`/api/workouts/${workoutId}`);
      if (response.ok) {
        const serverWorkout = await response.json();
        const local = mapServerWorkoutToLocal(serverWorkout);
        await localDB.workouts.put(local);
        return local;
      }
    }

    return null;
  } catch (error) {
    console.error('[localData] getWorkout error:', error);
    return null;
  }
}

export async function getWorkoutsByPlanAndWeek(
  planId: string,
  weekIndex: number
): Promise<LocalWorkout[]> {
  if (!isIndexedDBSupported()) return [];

  try {
    const cached = await localDB.workouts.where({ planId, weekIndex }).toArray();
    if (cached.length > 0) return cached;

    if (isOnline()) {
      const response = await fetch(`/api/workouts?planId=${planId}&weekIndex=${weekIndex}`);
      if (response.ok) {
        const serverWorkouts = await response.json();
        const locals = serverWorkouts.map(mapServerWorkoutToLocal);
        await localDB.workouts.bulkPut(locals);
        return locals;
      }
    }

    return [];
  } catch (error) {
    console.error('[localData] getWorkoutsByPlanAndWeek error:', error);
    return [];
  }
}

export async function getTodayWorkout(userId: string): Promise<LocalWorkout | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    const cached = await localDB.workouts.where({ userId, sessionDate: today }).first();

    if (cached) return cached;

    if (isOnline()) {
      const response = await fetch(`/api/workouts/today?userId=${userId}`);
      if (response.ok) {
        const serverWorkout = await response.json();
        if (serverWorkout) {
          const local = mapServerWorkoutToLocal(serverWorkout);
          await localDB.workouts.put(local);
          return local;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[localData] getTodayWorkout error:', error);
    return null;
  }
}

// ============================================================================
// Workout Log Operations (Offline-First Critical Path)
// ============================================================================

export async function saveWorkoutLog(
  logData: Omit<LocalWorkoutLog, 'id' | 'createdAt' | '_isDirty' | '_syncedAt'>
): Promise<string> {
  if (!isIndexedDBSupported()) {
    throw new Error('IndexedDB not supported');
  }

  try {
    const logId = uuidv4();
    const log: LocalWorkoutLog = {
      ...logData,
      id: logId,
      createdAt: Date.now(),
      _isDirty: true,
      _syncedAt: null,
      _tempId: logId, // Track temp ID until server assigns real ID
    };

    await localDB.workoutLogs.add(log);
    return logId;
  } catch (error) {
    console.error('[localData] saveWorkoutLog error:', error);
    throw error;
  }
}

export async function saveWorkoutLogSets(
  logId: string,
  sets: Array<Omit<LocalWorkoutLogSet, 'id' | 'logId' | 'createdAt' | '_isDirty' | '_syncedAt'>>
): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const localSets: LocalWorkoutLogSet[] = sets.map((set) => ({
      ...set,
      id: uuidv4(),
      logId,
      createdAt: Date.now(),
      _isDirty: true,
      _syncedAt: null,
      _tempId: uuidv4(),
    }));

    await localDB.workoutLogSets.bulkAdd(localSets);
  } catch (error) {
    console.error('[localData] saveWorkoutLogSets error:', error);
    throw error;
  }
}

export async function getWorkoutLogsByUser(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<LocalWorkoutLog[]> {
  if (!isIndexedDBSupported()) return [];

  try {
    let query = localDB.workoutLogs.where('userId').equals(userId);

    if (startDate && endDate) {
      query = query.and((log) => log.sessionDate >= startDate && log.sessionDate <= endDate);
    }

    const logs = await query.toArray();
    return logs;
  } catch (error) {
    console.error('[localData] getWorkoutLogsByUser error:', error);
    return [];
  }
}

export async function getWorkoutLogSets(logId: string): Promise<LocalWorkoutLogSet[]> {
  if (!isIndexedDBSupported()) return [];

  try {
    return await localDB.workoutLogSets.where('logId').equals(logId).toArray();
  } catch (error) {
    console.error('[localData] getWorkoutLogSets error:', error);
    return [];
  }
}

// ============================================================================
// Meal Operations
// ============================================================================

export async function saveMeal(
  mealData: Omit<LocalMeal, 'id' | 'createdAt' | '_isDirty' | '_syncedAt'>
): Promise<string> {
  if (!isIndexedDBSupported()) {
    throw new Error('IndexedDB not supported');
  }

  try {
    const mealId = uuidv4();
    const meal: LocalMeal = {
      ...mealData,
      id: mealId,
      createdAt: Date.now(),
      _isDirty: true,
      _syncedAt: null,
      _tempId: mealId,
    };

    await localDB.meals.add(meal);
    return mealId;
  } catch (error) {
    console.error('[localData] saveMeal error:', error);
    throw error;
  }
}

export async function getMealsByDate(userId: string, date: string): Promise<LocalMeal[]> {
  if (!isIndexedDBSupported()) return [];

  try {
    const cached = await localDB.meals.where({ userId, mealDate: date }).toArray();

    if (cached.length > 0) return cached;

    if (isOnline()) {
      const response = await fetch(`/api/nutrition/meals?userId=${userId}&date=${date}`);
      if (response.ok) {
        const serverMeals = await response.json();
        const locals = serverMeals.map(mapServerMealToLocal);
        await localDB.meals.bulkPut(locals);
        return locals;
      }
    }

    return [];
  } catch (error) {
    console.error('[localData] getMealsByDate error:', error);
    return [];
  }
}

// ============================================================================
// Coach Cache Operations
// ============================================================================

export async function getCoachCache(
  userId: string,
  context: string,
  cacheKey: string
): Promise<LocalCoachCache | null> {
  if (!isIndexedDBSupported()) return null;

  try {
    const cached = await localDB.coachCache
      .where(['userId', 'context', 'cacheKey'])
      .equals([userId, context, cacheKey])
      .first();

    if (cached) {
      // Check expiration
      if (cached.expiresAt && cached.expiresAt < Date.now()) {
        await localDB.coachCache.delete(cached.id);
        return null;
      }
      return cached;
    }

    return null;
  } catch (error) {
    console.error('[localData] getCoachCache error:', error);
    return null;
  }
}

export async function saveCoachCache(cache: Omit<LocalCoachCache, '_syncedAt'>): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const local: LocalCoachCache = {
      ...cache,
      _syncedAt: Date.now(),
    };

    await localDB.coachCache.put(local);
  } catch (error) {
    console.error('[localData] saveCoachCache error:', error);
  }
}

// ============================================================================
// Sync Queue Operations (for Phase 4)
// ============================================================================

export async function getDirtyLogs(): Promise<LocalWorkoutLog[]> {
  if (!isIndexedDBSupported()) return [];
  return localDB.workoutLogs.where('_isDirty').equals(1).toArray();
}

export async function getDirtyMeals(): Promise<LocalMeal[]> {
  if (!isIndexedDBSupported()) return [];
  return localDB.meals.where('_isDirty').equals(1).toArray();
}

export async function getDirtyProfiles(): Promise<LocalProfile[]> {
  if (!isIndexedDBSupported()) return [];
  return localDB.profiles.where('_isDirty').equals(1).toArray();
}

export async function markAsSynced(
  table: 'profiles' | 'plans' | 'workouts' | 'workoutLogs' | 'workoutLogSets' | 'meals',
  id: string
): Promise<void> {
  if (!isIndexedDBSupported()) return;

  try {
    const updateData = {
      _isDirty: false,
      _syncedAt: Date.now(),
    };

    switch (table) {
      case 'profiles':
        await localDB.profiles.update(id, updateData);
        break;
      case 'plans':
        await localDB.plans.update(id, updateData);
        break;
      case 'workouts':
        await localDB.workouts.update(id, updateData);
        break;
      case 'workoutLogs':
        await localDB.workoutLogs.update(id, updateData);
        break;
      case 'workoutLogSets':
        await localDB.workoutLogSets.update(id, updateData);
        break;
      case 'meals':
        await localDB.meals.update(id, updateData);
        break;
    }
  } catch (error) {
    console.error('[localData] markAsSynced error:', error);
  }
}

// ============================================================================
// Server-to-Local Mappers
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapServerProfileToLocal(server: any): LocalProfile {
  return {
    userId: server.userId as string,
    fullName: server.fullName as string | null,
    sex: (server.sex as Sex) || 'unspecified',
    dateOfBirth: server.dateOfBirth as string | null,
    heightCm: server.heightCm as string | null,
    weightKg: server.weightKg as string | null,
    unitSystem: (server.unitSystem as UnitSystem) || 'metric',
    hasPcos: (server.hasPcos as boolean) || false,
    experienceLevel: (server.experienceLevel as ExperienceLevel) || 'beginner',
    scheduleDaysPerWeek: server.scheduleDaysPerWeek as number | null,
    scheduleMinutesPerSession: server.scheduleMinutesPerSession as number | null,
    scheduleWeeks: server.scheduleWeeks as number | null,
    preferredDays: (server.preferredDays as PreferredDay[]) || [],
    equipment: (server.equipment as string[]) || [],
    avoidList: (server.avoidList as string[]) || [],
    noHighImpact: (server.noHighImpact as boolean) || false,
    goalBias: (server.goalBias as GoalBias) || 'balanced',
    coachTone: (server.coachTone as CoachTone) || 'analyst',
    coachTodayEnabled: server.coachTodayEnabled ?? true,
    coachDebriefEnabled: server.coachDebriefEnabled ?? true,
    coachWeeklyEnabled: server.coachWeeklyEnabled ?? true,
    coachNotes: server.coachNotes as string | null,
    timezone: (server.timezone as string) || 'UTC',
    createdAt: new Date(server.createdAt as string).getTime(),
    updatedAt: new Date(server.updatedAt as string).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

function mapServerPlanToLocal(server: any): LocalPlan {
  return {
    id: server.id as string,
    userId: server.userId as string,
    title: (server.title as string) || 'FitCoach Plan',
    summary: server.summary as string | null,
    status: (server.status as PlanStatus) || 'draft',
    active: (server.active as boolean) || false,
    startDate: server.startDate as string | null,
    durationWeeks: server.durationWeeks as number,
    daysPerWeek: server.daysPerWeek as number,
    minutesPerSession: server.minutesPerSession as number,
    preferredDays: (server.preferredDays as PreferredDay[]) || [],
    microcycle: server.microcycle as PlanMicrocycle,
    calendar: server.calendar as PlanCalendar,
    plannerVersion: server.plannerVersion as string | null,
    generatedBy: (server.generatedBy as string) || 'planner',
    createdAt: new Date(server.createdAt as string).getTime(),
    updatedAt: new Date(server.updatedAt as string).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

function mapServerWorkoutToLocal(server: any): LocalWorkout {
  return {
    id: server.id as string,
    planId: server.planId as string,
    userId: server.userId as string,
    microcycleDayId: server.microcycleDayId as string,
    dayIndex: server.dayIndex as number,
    weekIndex: server.weekIndex as number,
    weekNumber: server.weekNumber as number,
    weekStatus: server.weekStatus as WeekStatus | null,
    sessionDate: server.sessionDate as string | null,
    title: server.title as string,
    focus: server.focus as string,
    kind: (server.kind as WorkoutKind) || 'strength',
    isDeload: (server.isDeload as boolean) || false,
    durationMinutes: server.durationMinutes as number,
    payload: server.payload as WorkoutPayload,
    generationContext: server.generationContext as Record<string, unknown> | null,
    coachingNotes: server.coachingNotes as string | null,
    createdAt: new Date(server.createdAt as string).getTime(),
    updatedAt: new Date(server.updatedAt as string).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

function mapServerMealToLocal(server: any): LocalMeal {
  return {
    id: server.id as string,
    userId: server.userId as string,
    mealDate: server.mealDate as string,
    mealTime: new Date(server.mealTime as string).getTime(),
    mealType: server.mealType as MealType,
    description: server.description as string | null,
    photoUrl: server.photoUrl as string | null,
    calories: server.calories as number | null,
    proteinGrams: server.proteinGrams as string | null,
    carbsGrams: server.carbsGrams as string | null,
    fatGrams: server.fatGrams as string | null,
    fiberGrams: server.fiberGrams as string | null,
    notes: server.notes as string | null,
    source: server.source as string,
    createdAt: new Date(server.createdAt as string).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
