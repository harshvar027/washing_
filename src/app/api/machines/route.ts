import { NextResponse } from "next/server";
import { boardJson, errorJson, methodLocked } from "@/lib/http";
import { getMachines } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const machines = await getMachines();
    return boardJson(machines);
  } catch {
    return errorJson("Could not read the laundry board.", 500);
  }
}

export function PUT() {
  return methodLocked();
}

export function PATCH() {
  return methodLocked();
}

export function DELETE() {
  return methodLocked();
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { Allow: "GET" } });
}
