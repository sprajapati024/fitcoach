const DEFAULT_ID_LENGTH = 12;

/**
 * Create a custom prefixed ID (not UUID compatible)
 * Use this for IDs that are stored as TEXT in the database
 */
export function createId(prefix: string) {
  if (!prefix) {
    throw new Error("createId requires a prefix");
  }

  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    const uuid = crypto.randomUUID().replace(/-/g, "");
    return `${prefix}_${uuid.slice(0, DEFAULT_ID_LENGTH)}`;
  }

  const fallback = Array.from({ length: DEFAULT_ID_LENGTH }, () =>
    Math.floor(Math.random() * 36)
      .toString(36)
      .toLowerCase(),
  ).join("");
  return `${prefix}_${fallback}`;
}

/**
 * Create a proper UUID for database columns with UUID type
 */
export function createUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID()
  throw new Error("crypto.randomUUID() not available");
}

/**
 * Create plan ID - returns proper UUID for database
 */
export function createPlanId() {
  return createUUID();
}

/**
 * Create workout ID - returns proper UUID for database
 */
export function createWorkoutId() {
  return createUUID();
}

/**
 * Create microcycle ID - returns custom prefixed ID (stored as TEXT)
 */
export function createMicrocycleId() {
  return createId("mc");
}

/**
 * Create log ID - returns proper UUID for database
 */
export function createLogId() {
  return createUUID();
}

export function createCoachCacheKey(kind: string, target: string) {
  return `${kind}:${target}`;
}
