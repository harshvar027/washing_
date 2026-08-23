import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { boardJson, errorJson, methodLocked } from "@/lib/http";
import { occupyMachine } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorJson("Sign in with Google first to use a machine.", 401);
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const machines = await occupyMachine(id, {
      name: String(session.user.name || body.name || ""),
      room: String(body.room ?? ""),
      phone: String(session.user.phone || body.phone || ""),
      cycleMinutes: Number(body.cycleMinutes),
    });
    return boardJson(machines);
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
