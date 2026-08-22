import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { CYCLE_MINUTES, FLOORS, MACHINE_NUMBERS } from "./constants";
import type { CycleMinutes, Machine, Occupant, OccupyPayload } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "machines.json");

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

let writeChain = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
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

async function readBoard(): Promise<Machine[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return sanitizeBoard(JSON.parse(raw));
  } catch {
    return emptyBoard();
  }
}

async function writeBoard(machines: Machine[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(machines, null, 2), "utf8");
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
