import { TIME_ZONE } from "./constants";
import type { BoardPayload, Machine, MachineStatus, PublicMachine } from "./types";

function formatStarted(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function remainingSecondsFor(occupant: Machine["occupant"], now: number) {
  if (!occupant) return null;
  const started = Date.parse(occupant.startedAt);
  if (!Number.isFinite(started)) return 0;
  const endsAt = started + occupant.cycleMinutes * 60_000;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function presentMachine(machine: Machine, now: number): PublicMachine {
  const remainingSeconds = remainingSecondsFor(machine.occupant, now);
  let status: MachineStatus = "free";
  if (machine.occupant) {
    status = remainingSeconds && remainingSeconds > 0 ? "washing" : "ready";
  }

  return {
    id: machine.id,
    floor: machine.floor,
    number: machine.number,
    status,
    remainingSeconds,
    startedLabel: machine.occupant ? formatStarted(machine.occupant.startedAt) : null,
    occupant: machine.occupant
      ? {
          name: machine.occupant.name,
          phone: machine.occupant.phone,
          cycleMinutes: machine.occupant.cycleMinutes,
        }
      : null,
  };
}

export function presentBoard(machines: Machine[]): BoardPayload {
  const serverNow = Date.now();
  return {
    serverNow,
    machines: machines.map((machine) => presentMachine(machine, serverNow)),
  };
}
