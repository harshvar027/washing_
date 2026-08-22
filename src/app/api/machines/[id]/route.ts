import { methodLocked } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return methodLocked();
}

export function POST() {
  return methodLocked();
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
