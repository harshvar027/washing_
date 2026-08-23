import { boardJson, errorJson, methodLocked } from "@/lib/http";
import { freeMachine } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const machines = await freeMachine(id, String(body.token ?? ""));
    return boardJson(machines);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not free this machine.";
    const status = message.includes("Only the person") ? 403 : 400;
    return errorJson(message, status);
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
