import { openDB, type IDBPDatabase } from "idb";
import { logRequestSchema, type WorkoutLogRequest } from "@/lib/validation";

const DB_NAME = "fitcoach-offline";
const STORE_NAME = "logQueue";
const DB_VERSION = 1;

type QueueEntry = {
  id?: number;
  body: WorkoutLogRequest;
  createdAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDb() {
  if (dbPromise) {
    return dbPromise;
  }

  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB not supported in this environment");
  }

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    },
  });

  return dbPromise;
}

async function registerBackgroundSync(tag: string) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
  } catch (error) {
    console.warn("Failed to register background sync", error);
  }
}

export async function enqueueLog(request: WorkoutLogRequest) {
  const payload = logRequestSchema.parse(request);
  const database = await getDb();
  const now = Date.now();

  const entry: QueueEntry = {
    body: payload,
    createdAt: now,
  };

  await database.add(STORE_NAME, entry);

  void registerBackgroundSync("fitcoach-log-sync");
}

export async function getQueuedLogCount() {
  const database = await getDb();
  return (await database.getAllKeys(STORE_NAME)).length;
}

async function sendLog(payload: WorkoutLogRequest) {
  const response = await fetch("/api/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync log: ${response.status}`);
  }
}

export async function flushQueue() {
  const database = await getDb();
  const tx = database.transaction(STORE_NAME, "readwrite");
  const store = tx.store;
  const entries = (await store.getAll()) as QueueEntry[];

  for (const entry of entries) {
    try {
      await sendLog(entry.body);
      await store.delete(entry.id);
    } catch (error) {
      console.warn("Retaining log entry for retry", error);
    }
  }

  await tx.done;
}

export function attachOnlineSync() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void flushQueue();
  });
}
