"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FLOORS, PENDING_MACHINE_KEY } from "@/lib/constants";
import type { BoardPayload, PublicMachine } from "@/lib/types";
import { AuthButton } from "./AuthButton";
import { MachineCard } from "./MachineCard";
import { ThemeToggle } from "./ThemeToggle";

async function readError(response: Response) {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  throw new Error(data?.error || "Something went wrong. Try again.");
}

export function LaundryBoard() {
  const { data: session, status } = useSession();
  const [machines, setMachines] = useState<PublicMachine[]>([]);
  const [syncedAt, setSyncedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFloor, setActiveFloor] = useState<(typeof FLOORS)[number]>(1);
  const [pendingMachineId, setPendingMachineId] = useState<string | null>(null);

  const applyBoard = useCallback((data: BoardPayload) => {
    setMachines(data.machines);
    setSyncedAt(performance.now());
    setNow(performance.now());
    setLoading(false);
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/machines", { cache: "no-store" });
    if (!response.ok) {
      await readError(response);
    }
    applyBoard((await response.json()) as BoardPayload);
  }, [applyBoard]);

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_MACHINE_KEY);
    if (pending) setPendingMachineId(pending);
    load().catch((error: Error) => {
      setNotice(error.message);
      setLoading(false);
    });
    const poll = window.setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(performance.now()), 250);
    return () => window.clearInterval(tick);
  }, []);

  const elapsedSeconds = syncedAt ? Math.max(0, (now - syncedAt) / 1000) : 0;

  const grouped = useMemo(
    () =>
      FLOORS.map((floor) => ({
        floor,
        machines: machines.filter((machine) => machine.floor === floor),
      })),
    [machines],
  );

  const inUse = machines.filter((machine) => machine.occupant).length;
  const readyCount = machines.filter((machine) => {
    if (!machine.occupant || machine.remainingSeconds == null) return false;
    return machine.remainingSeconds - elapsedSeconds <= 0;
  }).length;

  function liveRemaining(machine: PublicMachine) {
    if (machine.remainingSeconds == null) return null;
    return Math.max(0, machine.remainingSeconds - elapsedSeconds);
  }

  async function occupy(
    id: string,
    payload: { name: string; room: string; phone: string; cycleMinutes: number },
  ) {
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/machines/${id}/occupy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          room: payload.room,
          phone: payload.phone,
          cycleMinutes: payload.cycleMinutes,
        }),
      });
      if (!response.ok) {
        await readError(response);
      }
      applyBoard((await response.json()) as BoardPayload);
    } finally {
      setBusyId(null);
    }
  }

  async function free(id: string) {
    setBusyId(id);
    setNotice("");
    try {
      const response = await fetch(`/api/machines/${id}/free`, {
        method: "POST",
      });
      if (!response.ok) {
        await readError(response);
      }
      applyBoard((await response.json()) as BoardPayload);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not free machine.");
    } finally {
      setBusyId(null);
    }
  }

  function goToFloor(floor: (typeof FLOORS)[number]) {
    setActiveFloor(floor);
    document.getElementById(`floor-${floor}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="relative z-10 mx-auto min-h-dvh max-w-5xl px-4 pb-20 pt-6 sm:px-6">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />

      <header className="glass shine fade-up overflow-hidden rounded-[36px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="glass glass-strong shrink-0 rounded-2xl px-2.5 py-2">
              <img
                src="/your-space-logo.png"
                alt="your space"
                className="relative z-10 h-9 w-auto sm:h-11"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em] text-[var(--header-kicker)] uppercase">
                Hostel laundry
              </p>
              <h1 className="display mt-1 text-3xl leading-none text-[var(--header-title)] sm:text-5xl">
                Your Space 1
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AuthButton />
            <ThemeToggle />
          </div>
        </div>
        <p className="relative z-10 mt-4 max-w-xl text-sm leading-6 text-[var(--header-copy)] sm:text-base">
          Three floors. Two machines each. Sign in with Google to put your name
          on a washer, then the next person can call you when the clothes are
          done.
        </p>
        <div className="relative z-10 mt-5 flex flex-wrap gap-2 text-sm">
          <span className="glass rounded-full bg-[var(--chip-free-bg)] px-3 py-1.5 font-semibold text-[#2f7a58]">
            {6 - inUse} free
          </span>
          <span className="glass rounded-full bg-[var(--chip-run-bg)] px-3 py-1.5 font-semibold text-[#9a5e1d]">
            {inUse} running
          </span>
          {readyCount > 0 ? (
            <span className="glass rounded-full bg-[var(--chip-ready-bg)] px-3 py-1.5 font-semibold text-[#c43c32]">
              {readyCount} waiting to collect
            </span>
          ) : null}
        </div>
        <p className="glass relative z-10 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[var(--header-copy)]">
          <span className="dot-live h-1.5 w-1.5 rounded-full bg-[#1aa392]" />
          Timers are locked on the hostel server
        </p>
      </header>

      <nav className="sticky top-3 z-20 mt-5 overflow-x-auto no-scrollbar">
        <div className="glass flex gap-2 rounded-full p-1.5">
          {grouped.map(({ floor, machines: floorMachines }) => (
            <button
              key={floor}
              type="button"
              onClick={() => goToFloor(floor)}
              className={`btn-press relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold ${
                activeFloor === floor
                  ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                  : "text-[var(--nav-text)]"
              }`}
            >
              Floor {floor}
              <span className="flex gap-1">
                {floorMachines.map((machine) => {
                  const remaining = liveRemaining(machine);
                  const tone =
                    !machine.occupant
                      ? "bg-[#2f7a58]"
                      : remaining === 0
                        ? "bg-[#c43c32]"
                        : "bg-[#c4843c]";
                  return (
                    <span
                      key={machine.id}
                      className={`h-1.5 w-1.5 rounded-full ${tone}`}
                    />
                  );
                })}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {notice ? (
        <p className="glass mt-4 rounded-2xl bg-[var(--chip-ready-bg)] px-4 py-3 text-sm font-medium text-[#c43c32]">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-16 text-center text-[var(--page-muted)]">Loading machines…</p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map(({ floor, machines: floorMachines }, floorIndex) => (
            <section
              key={floor}
              id={`floor-${floor}`}
              className="fade-up scroll-mt-24"
              style={{ animationDelay: `${floorIndex * 90}ms` }}
            >
              <div className="mb-4 flex items-end justify-between">
                <h2 className="display text-3xl text-[var(--page-text)]">Floor {floor}</h2>
                <p className="text-sm text-[var(--page-faint)]">2 machines</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {floorMachines.map((machine) => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    remainingSeconds={liveRemaining(machine)}
                    busy={busyId === machine.id}
                    signedIn={Boolean(session?.user)}
                    sessionLoading={status === "loading"}
                    startOpen={
                      pendingMachineId === machine.id &&
                      status === "authenticated" &&
                      Boolean(session?.user)
                    }
                    onOccupy={async (payload) => {
                      sessionStorage.removeItem(PENDING_MACHINE_KEY);
                      setPendingMachineId(null);
                      await occupy(machine.id, payload);
                    }}
                    onFree={() => free(machine.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <footer className="glass mx-auto mt-16 flex w-fit items-center justify-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--page-faint)]">
        <img
          src="/your-space-logo.png"
          alt=""
          className="relative z-10 h-6 w-auto opacity-90"
        />
        <span className="relative z-10">Your Space 1 · laundry board</span>
      </footer>
    </main>
  );
}
