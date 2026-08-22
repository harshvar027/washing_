"use client";

import { formatCountdown } from "@/lib/format";
import type { MachineStatus } from "@/lib/types";

type Props = {
  status: MachineStatus;
  remainingSeconds: number | null;
  cycleMinutes: number | null;
};

export function WasherVisual({ status, remainingSeconds, cycleMinutes }: Props) {
  const total = (cycleMinutes ?? 0) * 60;
  const remaining = remainingSeconds ?? 0;
  const ratio =
    status === "free" || total <= 0 ? 0 : Math.min(1, Math.max(0, remaining / total));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * ratio;

  const ring =
    status === "ready" ? "#c43c32" : status === "washing" ? "#1aa392" : "var(--washer-dash)";
  const face =
    status === "ready"
      ? "var(--washer-face-ready)"
      : status === "washing"
        ? "var(--washer-face-wash)"
        : "var(--washer-face)";

  return (
    <div className="relative mx-auto grid h-[168px] w-[168px] place-items-center">
      <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-[var(--washer-from)] to-[var(--washer-to)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_18px_30px_rgba(0,0,0,0.18)]" />
      <div className="absolute inset-[10px] rounded-[28px] bg-[var(--washer-inner)]" />
      <svg viewBox="0 0 140 140" className="relative h-[140px] w-[140px]">
        <circle cx="70" cy="70" r="62" fill="var(--washer-rim)" />
        <circle cx="70" cy="70" r="58" fill={face} />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(23,33,30,0.08)"
          strokeWidth="7"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div
          className={`grid h-[78px] w-[78px] place-items-center rounded-full border-[5px] border-dashed ${
            status === "washing" ? "drum-spin border-[#0f6b63]" : "border-[var(--washer-dash)]"
          } ${status === "ready" ? "border-[#c43c32]" : ""}`}
        >
          {status === "washing" ? (
            <span className="text-[1.35rem] font-semibold tracking-tight text-[var(--washer-count)]">
              {formatCountdown(remaining)}
            </span>
          ) : status === "ready" ? (
            <span className="text-sm font-bold tracking-[0.14em] text-[#c43c32]">
              DONE
            </span>
          ) : (
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--card-faint)]">
              FREE
            </span>
          )}
        </div>
      </div>
      {status === "washing" ? (
        <>
          <span className="bubble absolute top-[46px] left-[58px] h-2 w-2 rounded-full bg-[#0f6b63]/40" />
          <span className="bubble absolute top-[54px] right-[52px] h-1.5 w-1.5 rounded-full bg-[#0f6b63]/30 [animation-delay:0.6s]" />
        </>
      ) : null}
    </div>
  );
}
