export type CycleMinutes = 30 | 45 | 60;
export type MachineStatus = "free" | "washing" | "ready";

export type Occupant = {
  name: string;
  room: string;
  phone: string;
  startedAt: string;
  cycleMinutes: CycleMinutes;
  claimToken: string;
  claimId: string;
};

export type Machine = {
  id: string;
  floor: 1 | 2 | 3;
  number: 1 | 2;
  occupant: Occupant | null;
};

export type OccupyPayload = {
  name: string;
  room: string;
  phone: string;
  cycleMinutes: number;
};

export type PublicOccupant = {
  name: string;
  room: string;
  phone: string;
  cycleMinutes: CycleMinutes;
  claimId: string;
};

export type PublicMachine = {
  id: string;
  floor: 1 | 2 | 3;
  number: 1 | 2;
  status: MachineStatus;
  remainingSeconds: number | null;
  startedLabel: string | null;
  occupant: PublicOccupant | null;
};

export type BoardPayload = {
  serverNow: number;
  machines: PublicMachine[];
  claimToken?: string;
  claimId?: string;
};
