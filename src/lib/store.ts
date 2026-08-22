import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { CYCLE_MINUTES, FLOORS, MACHINE_NUMBERS } from "./constants";
import type { CycleMinutes, Machine, Occupant, OccupyPayload } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "machines.json");
const REDIS_KEY = "your-space-1:machines";
const REDIS_LOCK = "your-space-1:machines:lock";

function emptyBoard(): Machine[] {
  return FLOORS.flatMap((floor) =>
    MACHINE_NUMBERS.map((number) => ({
      id: `${floor}-${number}`,
      floor,
      number,
      occupant: null,
    })),
  );
}

function remoteConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function isServerlessDisk() {
  return Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );
}

function missingStoreError() {
  return new Error(
    "This host cannot save laundry data to disk. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the Vercel project settings.",
  );
}

async function redis(command: Array<string | number>) {
  const config = remoteConfig();
  if (!config) {
    throw missingStoreError();
  }

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | { result?: unknown; error?: string }
    | null;

  if (!response.ok || data?.error) {
    throw new Error(data?.error || "Could not reach the laundry database.");
  }

  return data?.result;
}

function isCycle(value: unknown): value is CycleMinutes {
  return (CYCLE_MINUTES as readonly number[]).includes(Number(value));
}

function sanitizeOccupant(raw: unknown): Occupant | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = String(row.name ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = String(row.phone ?? "").replace(/\D/g, "");
  const startedAt = Date.parse(String(row.startedAt ?? ""));
  const cycleMinutes = Number(row.cycleMinutes);
  if (name.length < 2 || name.length > 40) return null;
  if (!/^[6-9]\d{9}$/.test(phone)) return null;
  if (!isCycle(cycleMinutes)) return null;
  if (!Number.isFinite(startedAt)) return null;

  return {
    name,
    phone,
    startedAt: new Date(startedAt).toISOString(),
    cycleMinutes,
  };
}

function sanitizeBoard(raw: unknown): Machine[] {
  const byId = new Map<string, Occupant | null>();
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      if (typeof item.id === "string") {
        byId.set(item.id, sanitizeOccupant(item.occupant));
      }
    }
  }

  return emptyBoard().map((machine) => ({
    ...machine,
    occupant: byId.get(machine.id) ?? null,
  }));
}

async function readFileBoard(): Promise<Machine[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return sanitizeBoard(JSON.parse(raw));
  } catch {
    return emptyBoard();
  }
}

async function writeFileBoard(machines: Machine[]) {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(machines, null, 2), "utf8");
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
    if (code === "EROFS" || isServerlessDisk()) {
      throw missingStoreError();
    }
    throw error;
  }
}

async function readRemoteBoard(): Promise<Machine[]> {
  const raw = await redis(["GET", REDIS_KEY]);
  if (typeof raw !== "string" || !raw) {
    return emptyBoard();
  }
  return sanitizeBoard(JSON.parse(raw));
}

async function writeRemoteBoard(machines: Machine[]) {
  await redis(["SET", REDIS_KEY, JSON.stringify(machines)]);
}

async function readBoard(): Promise<Machine[]> {
  if (remoteConfig()) {
    return readRemoteBoard();
  }
  if (isServerlessDisk()) {
    throw missingStoreError();
  }
  return readFileBoard();
}

async function writeBoard(machines: Machine[]) {
  if (remoteConfig()) {
    await writeRemoteBoard(machines);
    return;
  }
  if (isServerlessDisk()) {
    throw missingStoreError();
  }
  await writeFileBoard(machines);
}

let writeChain = Promise.resolve();

function withLocalLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (!remoteConfig()) {
    return withLocalLock(fn);
  }

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const locked = await redis(["SET", REDIS_LOCK, "1", "NX", "EX", 5]);
    if (locked === "OK") {
      try {
        return await fn();
      } finally {
        await redis(["DEL", REDIS_LOCK]);
      }
    }
    await sleep(60 * (attempt + 1));
  }

  throw new Error("The board is busy. Try again.");
}

export async function getMachines(): Promise<Machine[]> {
  return withLock(readBoard);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

function validateOccupy(payload: OccupyPayload) {
  const name = payload.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) {
    throw new Error("Enter a name between 2 and 40 characters.");
  }

  const phone = normalizePhone(payload.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }

  const cycleMinutes = Number(payload.cycleMinutes);
  if (!isCycle(cycleMinutes)) {
    throw new Error("Pick a wash cycle of 30, 45, or 60 minutes.");
  }

  return { name, phone, cycleMinutes };
}

export async function occupyMachine(
  id: string,
  payload: OccupyPayload,
): Promise<Machine[]> {
  return withLock(async () => {
    const machines = await readBoard();
    const machine = machines.find((item) => item.id === id);
    if (!machine) {
      throw new Error("That machine does not exist.");
    }
    if (machine.occupant) {
      throw new Error(
        "This machine is already in use. Call the person listed, then mark clothes collected.",
      );
    }

    const { name, phone, cycleMinutes } = validateOccupy(payload);

    machine.occupant = {
      name,
      phone,
      startedAt: new Date().toISOString(),
      cycleMinutes,
    };

    await writeBoard(machines);
    return machines;
  });
}

export async function freeMachine(id: string): Promise<Machine[]> {
  return withLock(async () => {
    const machines = await readBoard();
    const machine = machines.find((item) => item.id === id);
    if (!machine) {
      throw new Error("That machine does not exist.");
    }

    machine.occupant = null;
    await writeBoard(machines);
    return machines;
  });
}
