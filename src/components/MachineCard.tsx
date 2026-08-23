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
    room: string;
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
    const roomBit = occupant.room ? ` from room ${occupant.room}` : "";
    return `Hi ${occupant.name}${roomBit}, your clothes in Floor ${machine.floor} Machine ${machine.number} at Your Space 1 are done. Please collect them so the next person can use the machine.`;
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
        className={`glass card-lift overflow-hidden rounded-[32px] p-5 text-[var(--card-text)] ${
          status === "ready" ? "ready-pulse" : ""
        } ${status === "washing" ? "shine" : ""}`}
      >
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--card-faint)] uppercase">
              Machine {machine.number}
            </p>
            <h3 className="display mt-1 text-[2rem] leading-none">{statusCopy}</h3>
          </div>
          <span
            className={`relative z-10 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${
              status === "free"
                ? "bg-[var(--chip-free-bg)] text-[#2f7a58]"
                : status === "ready"
                  ? "bg-[var(--chip-ready-bg)] text-[#c43c32]"
                  : "bg-[var(--chip-run-bg)] text-[#c4843c]"
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
          <div className="glass glass-strong relative z-10 mt-4 rounded-[24px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{occupant.name}</p>
                {occupant.room ? (
                  <p className="mt-0.5 text-sm font-semibold text-[var(--card-text)]">
                    Room {occupant.room}
                  </p>
                ) : null}
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
          <p className="relative z-10 mt-4 text-sm leading-6 text-[var(--card-muted)]">
            Register your name, room, and phone before you start. They stay on
            this machine until the clothes are collected.
          </p>
        )}

        <div className="relative z-10 mt-4 grid gap-2">
          {occupant ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${occupant.phone}`}
                  className="btn-press rounded-2xl bg-[#0f6b63] px-3 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,107,99,0.28)]"
                >
                  Call
                </a>
                <a
                  href={`https://wa.me/91${occupant.phone}?text=${encodeURIComponent(pingMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-press rounded-2xl bg-[#128c7e] px-3 py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_24px_rgba(18,140,126,0.28)]"
                >
                  WhatsApp
                </a>
              </div>
              {confirmFree ? (
                <div className="glass glass-strong rounded-2xl p-3">
                  <p className="relative z-10 text-sm leading-6 text-[var(--card-muted)]">
                    Only do this after the clothes are actually taken out. This
                    does not change the wash clock — it just frees the machine.
                  </p>
                  <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmFree(false)}
                      className="btn-press glass rounded-xl px-3 py-2.5 text-sm font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onFree}
                      className="btn-press rounded-xl bg-[var(--ink-btn)] px-3 py-2.5 text-sm font-semibold text-[var(--page)] disabled:opacity-60"
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
                  className="btn-press glass relative z-10 rounded-2xl px-3 py-3.5 text-sm font-semibold disabled:opacity-60"
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
              className="btn-press rounded-2xl bg-[#0f6b63] px-3 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,107,99,0.28)] disabled:opacity-60"
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
