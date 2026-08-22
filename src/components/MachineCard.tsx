"use client";

import { useMemo, useState } from "react";
import { formatCountdown, formatPhone } from "@/lib/format";
import type { MachineStatus, PublicMachine } from "@/lib/types";
import { OccupyModal } from "./OccupyModal";
import { WasherVisual } from "./WasherVisual";

type Props = {
  machine: PublicMachine;
  remainingSeconds: number | null;
  busy: boolean;
  onOccupy: (payload: {
    name: string;
    phone: string;
    cycleMinutes: number;
  }) => Promise<void>;
  onFree: () => Promise<void>;
};

export function MachineCard({
  machine,
  remainingSeconds,
  busy,
  onOccupy,
  onFree,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirmFree, setConfirmFree] = useState(false);
  const occupant = machine.occupant;
  const liveRemaining = remainingSeconds ?? 0;
  const status: MachineStatus = !occupant
    ? "free"
    : liveRemaining > 0
      ? "washing"
      : "ready";

  const pingMessage = useMemo(() => {
    if (!occupant) return "";
    return `Hi ${occupant.name}, your clothes in Floor ${machine.floor} Machine ${machine.number} at Your Space 1 are done. Please collect them so the next person can use the machine.`;
  }, [occupant, machine.floor, machine.number]);

  const statusCopy =
    status === "free"
      ? "Free"
      : status === "ready"
        ? "Collect now"
        : "Washing";

  return (
    <>
      <article
        className={`rounded-[32px] bg-[var(--card)] p-5 text-[var(--card-text)] shadow-[var(--shadow)] ${
          status === "ready" ? "ready-pulse" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--card-faint)] uppercase">
              Machine {machine.number}
            </p>
            <h3 className="display mt-1 text-[2rem] leading-none">{statusCopy}</h3>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              status === "free"
                ? "bg-[#e5f4ec] text-[#2f7a58]"
                : status === "ready"
                  ? "bg-[#fde3e0] text-[#c43c32]"
                  : "bg-[#fff1dd] text-[#c4843c]"
            }`}
          >
            {occupant ? `${occupant.cycleMinutes} min cycle` : "Empty"}
          </span>
        </div>

        <div className="mt-4">
          <WasherVisual
            status={status}
            remainingSeconds={remainingSeconds}
            cycleMinutes={occupant?.cycleMinutes ?? null}
          />
        </div>

        {occupant ? (
          <div className="mt-4 rounded-[24px] border border-[var(--card-line)] bg-[var(--ticket)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{occupant.name}</p>
                <p className="mt-0.5 text-sm text-[var(--card-muted)]">
                  {formatPhone(occupant.phone)}
                </p>
              </div>
              <p className="text-right text-xs font-medium text-[var(--card-faint)]">
                Started
                <br />
                <span className="text-sm text-[var(--card-text)]">{machine.startedLabel}</span>
              </p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--card-muted)]">
              {status === "ready" ? (
                <span className="font-semibold text-[#c43c32]">
                  Server timer finished. Please collect the clothes.
                </span>
              ) : (
                <>
                  <span className="font-semibold text-[var(--card-text)]">
                    {formatCountdown(liveRemaining)}
                  </span>{" "}
                  left · locked on hostel server
                </>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-[var(--card-muted)]">
            Register before you start. Your name and number stay on this machine
            until the clothes are collected.
          </p>
        )}

        <div className="mt-4 grid gap-2">
          {occupant ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${occupant.phone}`}
                  className="rounded-2xl bg-[#0f6b63] px-3 py-3.5 text-center text-sm font-semibold text-white"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/91${occupant.phone}?text=${encodeURIComponent(pingMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-[#128c7e] px-3 py-3.5 text-center text-sm font-semibold text-white"
                >
                  WhatsApp
                </a>
              </div>
              {confirmFree ? (
                <div className="rounded-2xl border border-[var(--card-line)] bg-[var(--ghost)] p-3">
                  <p className="text-sm leading-6 text-[var(--card-muted)]">
                    Only do this after the clothes are actually taken out. This
                    does not change the wash clock — it just frees the machine.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmFree(false)}
                      className="rounded-xl border border-[var(--card-line)] px-3 py-2.5 text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onFree}
                      className="rounded-xl bg-[var(--ink-btn)] px-3 py-2.5 text-sm font-semibold text-[var(--card)] disabled:opacity-60"
                    >
                      Yes, collected
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmFree(true)}
                  className="rounded-2xl border border-[var(--card-line)] bg-[var(--ghost)] px-3 py-3.5 text-sm font-semibold disabled:opacity-60"
                >
                  Clothes collected
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(true)}
              className="rounded-2xl bg-[#0f6b63] px-3 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              I am using this machine
            </button>
          )}
        </div>
      </article>

      {open ? (
        <OccupyModal
          floor={machine.floor}
          number={machine.number}
          busy={busy}
          onClose={() => setOpen(false)}
          onSubmit={async (payload) => {
            await onOccupy(payload);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
