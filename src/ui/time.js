// Day/night by the user's local time (or a pinned setting for testing).
let pinned = null;   // 'day' | 'night' | null
export const pinTime = (v) => { pinned = v; };
export function isNight(date = new Date()) {
  if (pinned) return pinned === 'night';
  const h = date.getHours();
  return h >= 20 || h < 6;
}
