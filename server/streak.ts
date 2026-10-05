/** Pure streak computation (testable without a DB). */
export function computeStreak(input: {
  streak: number;
  longestStreak: number;
  lastActiveAt: Date | null;
  now: Date;
}): { unchanged: boolean; streak: number; longestStreak: number } {
  const { now } = input;
  const lastActive = input.lastActiveAt ?? new Date(0);
  const longestBase = Math.max(input.longestStreak, input.streak);

  if (now.toDateString() === lastActive.toDateString()) {
    return { unchanged: true, streak: input.streak, longestStreak: longestBase };
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = yesterday.toDateString() === lastActive.toDateString();
  const streak = isConsecutive ? input.streak + 1 : 1;
  return { unchanged: false, streak, longestStreak: Math.max(longestBase, streak) };
}
