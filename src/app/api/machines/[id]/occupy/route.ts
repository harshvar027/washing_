import { boardJson, errorJson, methodLocked } from "@/lib/http";
import { occupyMachine } from "@/lib/store";

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
    const { machines, claimToken } = await occupyMachine(id, {
      name: String(body.name ?? ""),
      room: String(body.room ?? ""),
      phone: String(body.phone ?? ""),
      cycleMinutes: Number(body.cycleMinutes),
    });
    return boardJson(machines, {
      claimToken,
      claimId: machines.find((machine) => machine.id === id)?.occupant?.claimId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not register this machine.";
    return errorJson(message);
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
