const DEFAULT_ID_LENGTH = 12;

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

export function createPlanId() {
  return createId("plan");
}

export function createWorkoutId() {
  return createId("wo");
}

export function createLogId() {
  return createId("log");
}

export function createCoachCacheKey(kind: string, target: string) {
  return `${kind}:${target}`;
}
