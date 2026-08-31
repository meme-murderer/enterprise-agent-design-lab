import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Firestore } from "@google-cloud/firestore";
import { Redis } from "@upstash/redis";
import type { Canvas } from "@/lib/schemas";

const listKey = "agent-design-lab:submissions";
const maxDisplayedSubmissions = 500;

export type StorageMode = "firestore" | "redis" | "local" | "disabled";

export type SharedCanvas = {
  shareId: string;
  sharedAt: string;
  canvas: Canvas;
};

let firestoreClient: Firestore | null = null;
let localWriteQueue = Promise.resolve();

function localFile() {
  return (
    process.env.LOCAL_SHARE_FILE?.trim() ||
    path.join(process.cwd(), ".data", "submissions.json")
  );
}

function redis() {
  const url = process.env.REDIS_URL?.trim();
  const token = process.env.REDIS_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function projectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim() ||
    ""
  );
}

function firestore() {
  const id = projectId();
  if (!id) return null;
  firestoreClient ??= new Firestore({ projectId: id });
  return firestoreClient;
}

function collectionName() {
  return (
    process.env.FIRESTORE_COLLECTION?.trim() || "agent-design-lab-submissions"
  );
}

async function readLocal() {
  try {
    const rows = JSON.parse(
      await readFile(/* turbopackIgnore: true */ localFile(), "utf8"),
    ) as SharedCanvas[];
    return rows;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeLocalRows(rows: SharedCanvas[]) {
  const destination = localFile();
  await mkdir(path.dirname(destination), { recursive: true });
  const temporaryFile = `${destination}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(rows), "utf8");
  await rename(temporaryFile, destination);
}

async function saveLocal(submission: SharedCanvas) {
  localWriteQueue = localWriteQueue.then(async () => {
    const rows = await readLocal();
    await writeLocalRows([submission, ...rows]);
  });
  await localWriteQueue;
}

export function storageMode(): StorageMode {
  if (projectId()) return "firestore";
  if (redis()) return "redis";
  if (process.env.NODE_ENV !== "production") return "local";
  return "disabled";
}

export function sharingAvailable() {
  return storageMode() !== "disabled";
}

export async function saveSubmission(submission: SharedCanvas) {
  const mode = storageMode();

  if (mode === "firestore") {
    const store = firestore();
    if (!store) return false;
    await store
      .collection(collectionName())
      .doc(submission.shareId)
      .set(submission);
    return true;
  }

  if (mode === "redis") {
    const store = redis();
    if (!store) return false;
    await store.lpush(listKey, JSON.stringify(submission));
    return true;
  }

  if (mode === "local") {
    await saveLocal(submission);
    return true;
  }

  return false;
}

export async function listSubmissions() {
  const mode = storageMode();

  if (mode === "firestore") {
    const store = firestore();
    if (!store) return null;
    const snapshot = await store
      .collection(collectionName())
      .orderBy("sharedAt", "desc")
      .limit(maxDisplayedSubmissions)
      .get();
    return snapshot.docs.map((document) => document.data() as SharedCanvas);
  }

  if (mode === "redis") {
    const store = redis();
    if (!store) return null;
    const rows = await store.lrange<string>(
      listKey,
      0,
      maxDisplayedSubmissions - 1,
    );
    return rows.map(
      (row) =>
        (typeof row === "string" ? JSON.parse(row) : row) as SharedCanvas,
    );
  }

  if (mode === "local") return readLocal();
  return null;
}

export async function purgeSubmissions() {
  const mode = storageMode();

  if (mode === "firestore") {
    const store = firestore();
    if (!store) return false;
    let removed = 0;
    const collection = store.collection(collectionName());
    while (true) {
      const snapshot = await collection.limit(500).get();
      if (snapshot.empty) break;
      const batch = store.batch();
      snapshot.docs.forEach((document) => batch.delete(document.ref));
      await batch.commit();
      removed += snapshot.size;
      if (snapshot.size < 500) break;
    }
    return removed;
  }

  if (mode === "redis") {
    const store = redis();
    if (!store) return false;
    const removed = await store.llen(listKey);
    await store.del(listKey);
    return removed;
  }

  if (mode === "local") {
    let removed = 0;
    localWriteQueue = localWriteQueue.then(async () => {
      const rows = await readLocal();
      removed = rows.length;
      await writeLocalRows([]);
    });
    await localWriteQueue;
    return removed;
  }

  return false;
}
