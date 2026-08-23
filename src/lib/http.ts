import { NextResponse } from "next/server";
import { presentBoard } from "./publicBoard";
import type { Machine } from "./types";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function boardJson(
  machines: Machine[],
  extra: { claimToken?: string; claimId?: string } = {},
) {
  return NextResponse.json(
    { ...presentBoard(machines), ...extra },
    { headers: NO_STORE },
  );
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export function methodLocked() {
  return NextResponse.json(
    { error: "Wash timings are locked on the server and cannot be changed." },
    { status: 405, headers: { ...NO_STORE, Allow: "GET, POST" } },
  );
}
