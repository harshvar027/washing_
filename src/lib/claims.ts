const STORAGE_KEY = "your-space-claims";

export type StoredClaim = {
  token: string;
  claimId: string;
};

function readAll(): Record<string, StoredClaim> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const claims: Record<string, StoredClaim> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      if (typeof row.token === "string" && typeof row.claimId === "string") {
        claims[id] = { token: row.token, claimId: row.claimId };
      }
    }
    return claims;
  } catch {
    return {};
  }
}

function writeAll(claims: Record<string, StoredClaim>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

export function loadClaims() {
  return readAll();
}

export function saveClaim(machineId: string, claim: StoredClaim) {
  const claims = readAll();
  claims[machineId] = claim;
  writeAll(claims);
}

export function clearClaim(machineId: string) {
  const claims = readAll();
  delete claims[machineId];
  writeAll(claims);
}

export function pruneClaims(occupiedIds: string[]) {
  const claims = readAll();
  let changed = false;
  for (const id of Object.keys(claims)) {
    if (!occupiedIds.includes(id)) {
      delete claims[id];
      changed = true;
    }
  }
  if (changed) writeAll(claims);
  return claims;
}

export function ownsMachine(
  machineId: string,
  claimId: string | undefined,
  claims: Record<string, StoredClaim>,
) {
  return Boolean(claimId && claims[machineId]?.claimId === claimId);
}
