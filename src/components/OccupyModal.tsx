"use client";

import { FormEvent, useState } from "react";
import { CYCLE_MINUTES } from "@/lib/constants";

type Props = {
  floor: number;
  number: number;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    phone: string;
    cycleMinutes: number;
  }) => Promise<void>;
};

export function OccupyModal({
  floor,
  number,
  busy,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cycleMinutes, setCycleMinutes] = useState(45);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({ name, phone, cycleMinutes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[var(--overlay)] p-4 backdrop-blur-[3px] sm:place-items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[32px] bg-[var(--card)] p-5 text-[var(--card-text)] shadow-2xl"
      >
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--teal)] uppercase">
          Floor {floor} · Machine {number}
        </p>
        <h2 className="display mt-1 text-3xl">Claim this washer</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--card-muted)]">
          The cycle clock starts on the hostel server the moment you register.
          Phones cannot move it forward or back.
        </p>

        <label className="mt-5 block text-sm font-semibold">
          Name
          <input
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="mt-1.5 w-full rounded-2xl border border-[var(--card-line)] bg-[var(--ghost)] px-4 py-3 font-normal outline-none focus:border-[var(--teal)]"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold">
          Phone number
          <input
            required
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/[^\d+\s-]/g, ""))}
            placeholder="10-digit mobile"
            className="mt-1.5 w-full rounded-2xl border border-[var(--card-line)] bg-[var(--ghost)] px-4 py-3 font-normal outline-none focus:border-[var(--teal)]"
          />
        </label>

        <p className="mt-4 text-sm font-semibold">Wash cycle</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {CYCLE_MINUTES.map((cycle) => (
            <button
              key={cycle}
              type="button"
              onClick={() => setCycleMinutes(cycle)}
              className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                cycleMinutes === cycle
                  ? "border-[var(--teal)] bg-[var(--teal)] text-white"
                  : "border-[var(--card-line)] bg-[var(--ghost)] text-[var(--card-text)]"
              }`}
            >
              {cycle} min
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-[#c43c32]">{error}</p>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[var(--card-line)] bg-[var(--ghost)] px-3 py-3 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-[var(--teal)] px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Start timer
          </button>
        </div>
      </form>
    </div>
  );
}
