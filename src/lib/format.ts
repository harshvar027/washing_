export function formatPhone(phone: string) {
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  if (safe <= 0) return "0:00";
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
