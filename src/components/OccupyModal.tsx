"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { PENDING_MACHINE_KEY, CYCLE_MINUTES } from "@/lib/constants";
import { GoogleMark } from "./AuthButton";

type Props = {
  machineId: string;
  floor: number;
  number: number;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    room: string;
    phone: string;
    cycleMinutes: number;
  }) => Promise<void>;
};

export function OccupyModal({
  machineId,
  floor,
  number,
  busy,
  onClose,
  onSubmit,
}: Props) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [cycleMinutes, setCycleMinutes] = useState(45);
  const [error, setError] = useState("");

  useEffect(() => {
    const googleName = session?.user?.name?.trim() ?? "";
    const googlePhone = session?.user?.phone?.trim() ?? "";
    if (googleName) setName(googleName.slice(0, 40));
    if (googlePhone) setPhone(googlePhone);
  }, [session]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) {
      setError("Sign in with Google first.");
      return;
    }
    setError("");
    try {
      sessionStorage.removeItem(PENDING_MACHINE_KEY);
      await onSubmit({ name, room, phone, cycleMinutes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register.");
    }
  }

  function close() {
    sessionStorage.removeItem(PENDING_MACHINE_KEY);
    onClose();
  }

  function startGoogle() {
    sessionStorage.setItem(PENDING_MACHINE_KEY, machineId);
    void signIn("google", { callbackUrl: "/" });
  }

  const signedIn = Boolean(session?.user);
  const googlePhoneMissing = Boolean(session?.user && !session.user.phone);
  const nameLocked = Boolean(session?.user?.name?.trim());

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[var(--overlay)] p-4 backdrop-blur-xl sm:place-items-center">
      <form
        onSubmit={handleSubmit}
        className="glass glass-strong fade-up w-full max-w-md overflow-hidden rounded-[32px] p-5 text-[var(--card-text)]"
      >
        <p className="relative z-10 text-xs font-semibold tracking-[0.2em] text-[var(--teal)] uppercase">
          Floor {floor} · Machine {number}
        </p>
        <h2 className="display relative z-10 mt-1 text-3xl">Claim this washer</h2>
        <p className="relative z-10 mt-2 text-sm leading-6 text-[var(--card-muted)]">
          {signedIn
            ? "You must be signed in to start a wash. Add your room, pick a cycle, then start the timer."
            : "Google sign-in is required before you can use a machine."}
        </p>

        {!signedIn ? (
          <button
            type="button"
            onClick={startGoogle}
            className="btn-press glass relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
          >
            <GoogleMark />
            Sign in with Google
          </button>
        ) : (
          <p className="relative z-10 mt-4 text-sm text-[var(--teal)]">
            Signed in as {session?.user?.name || session?.user?.email}
          </p>
        )}

        {signedIn ? (
          <>
            <label className="relative z-10 mt-5 block text-sm font-semibold">
              Name
              <input
                required
                minLength={2}
                maxLength={40}
                value={name}
                readOnly={nameLocked}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="glass mt-1.5 w-full rounded-2xl px-4 py-3 font-normal outline-none focus:border-[var(--teal)] read-only:opacity-80"
              />
            </label>

            <label className="relative z-10 mt-4 block text-sm font-semibold">
              Room number
              <input
                required
                maxLength={8}
                value={room}
                onChange={(event) =>
                  setRoom(event.target.value.replace(/[^a-zA-Z0-9-\s]/g, ""))
                }
                placeholder="e.g. 203"
                className="glass mt-1.5 w-full rounded-2xl px-4 py-3 font-normal outline-none focus:border-[var(--teal)]"
              />
            </label>

            <label className="relative z-10 mt-4 block text-sm font-semibold">
              Phone number
              <input
                required
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/[^\d+\s-]/g, ""))
                }
                placeholder="10-digit mobile"
                className="glass mt-1.5 w-full rounded-2xl px-4 py-3 font-normal outline-none focus:border-[var(--teal)]"
              />
            </label>
            {googlePhoneMissing ? (
              <p className="relative z-10 mt-1.5 text-xs leading-5 text-[var(--card-muted)]">
                Google did not share a phone number. Enter your 10-digit mobile.
              </p>
            ) : null}

            <p className="relative z-10 mt-4 text-sm font-semibold">Wash cycle</p>
            <div className="relative z-10 mt-1.5 grid grid-cols-3 gap-2">
              {CYCLE_MINUTES.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setCycleMinutes(cycle)}
                  className={`btn-press rounded-2xl px-3 py-3 text-sm font-semibold ${
                    cycleMinutes === cycle
                      ? "bg-[var(--teal)] text-white shadow-[0_10px_20px_rgba(15,107,99,0.25)]"
                      : "glass text-[var(--card-text)]"
                  }`}
                >
                  {cycle} min
                </button>
              ))}
            </div>
          </>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm font-medium text-[#c43c32]">{error}</p>
        ) : null}

        <div className="relative z-10 mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={close}
            className="btn-press glass rounded-2xl px-3 py-3 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !signedIn}
            className="btn-press rounded-2xl bg-[var(--teal)] px-3 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,107,99,0.28)] disabled:opacity-60"
          >
            Start timer
          </button>
        </div>
      </form>
    </div>
  );
}
