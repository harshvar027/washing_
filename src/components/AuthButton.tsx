"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    getProviders()
      .then((providers) => setGoogleAvailable(Boolean(providers?.google)))
      .catch(() => setGoogleAvailable(false));
  }, []);

  if (session?.user) {
    return (
      <div className="flex min-w-0 max-w-full items-center gap-1.5 sm:max-w-[16rem]">
        <div className="glass relative z-10 inline-flex h-10 min-w-0 items-center gap-2 rounded-full px-2.5 text-sm font-semibold text-[var(--card-text)] sm:h-11 sm:px-3">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full"
            />
          ) : null}
          <span className="hidden truncate min-[420px]:inline">
            {session.user.name?.split(" ")[0] || "Signed in"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn-press glass relative z-10 inline-flex h-10 shrink-0 items-center rounded-full px-3 text-xs font-semibold text-[var(--card-text)] sm:h-11 sm:px-3.5 sm:text-sm"
        >
          Log out
        </button>
      </div>
    );
  }

  if (!googleAvailable || status === "loading") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="btn-press glass relative z-10 inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--card-text)] sm:h-11 sm:px-3.5"
    >
      <GoogleMark />
      Google
    </button>
  );
}

export function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.8c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-3c-1.1.7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.4 0 10.2 0 12s.5 3.6 1.4 5.4l3.9-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.6l3.9 3.1C6.2 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}
