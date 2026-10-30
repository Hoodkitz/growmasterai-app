/** UGC moderation rules (Google Play user generated content policy: report, block, remove). */

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "illegal",
  "sexual",
  "selling",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Distinct reporters after which a post is hidden until a human looks at it. */
export const AUTO_HIDE_REPORTS = 3;

export const MAX_POST_TITLE = 200;
export const MAX_POST_CONTENT = 5000;
export const MAX_COMMENT_CONTENT = 2000;
export const MAX_MESSAGE_CONTENT = 2000;

export function shouldAutoHide(distinctReporters: number): boolean {
  return distinctReporters >= AUTO_HIDE_REPORTS;
}

/** Ids a user must not see content from: people they blocked and people who blocked them. */
export function hiddenUserIds(
  me: number,
  blocks: { blockerId: number; blockedId: number }[],
): Set<number> {
  const out = new Set<number>();
  for (const b of blocks) {
    if (b.blockerId === me) out.add(b.blockedId);
    else if (b.blockedId === me) out.add(b.blockerId);
  }
  return out;
}

/** Only reports from accounts at least this old count towards auto-hide (stops fresh sock puppets). */
export const MIN_REPORTER_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REPORTS_PER_HOUR = 10;

/** Accounts created after this moment do not count towards auto-hide. */
export function reporterCutoff(now: number = Date.now()): Date {
  return new Date(now - MIN_REPORTER_AGE_MS);
}

/** Dismissing reports may only undo an automatic hide, never an admin removal. */
export function dismissRestoresPost(hiddenReason: string | null): boolean {
  return hiddenReason === "auto";
}

/** Max characters of one base64 post image (about 750 KB of binary data). */
export const MAX_POST_IMAGE_CHARS = 1_000_000;
export const MAX_POST_IMAGES = 4;
