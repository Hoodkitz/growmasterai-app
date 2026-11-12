/**
 * Smart Grow ist ein Add-on mit Aufpreis. Kostenlos: Simulator + Hardware-Ratgeber.
 * Mit Add-on: echte Geräte, Home Assistant, Autopilot, KI-Einschätzung, Kamera.
 */
export type AccessUser = {
  role?: string | null;
  smartGrowUntil?: Date | string | null;
};

export function hasSmartGrow(
  u: AccessUser | null | undefined,
  now = Date.now(),
): boolean {
  if (!u) return false;
  if (u.role === "admin") return true;
  if (!u.smartGrowUntil) return false;
  const t =
    typeof u.smartGrowUntil === "string"
      ? Date.parse(u.smartGrowUntil)
      : u.smartGrowUntil.getTime();
  return Number.isFinite(t) && t > now;
}

export const ADDON_REQUIRED_MESSAGE =
  "Dafür brauchst du das Add-on „Smart Grow“. Den Simulator kannst du kostenlos ausprobieren.";
