import { filterKnowledge } from "../../lib/knowledge-filter";
import { isUnlimitedAccount } from "../../lib/subscription";
import type { KnowledgeEntry } from "./types";

/** Free users see this many hits per search. */
export const FREE_BROWSE_LIMIT = 3;
const TEASER_CHARS = 140;

interface UserLike {
  email?: string | null;
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: Date | null;
}

export function hasPaidKnowledgeAccess(user: UserLike | null): boolean {
  if (!user) return false;
  if (isUnlimitedAccount(user.email)) return true;
  const paid =
    user.subscriptionTier === "premium" || user.subscriptionTier === "pro";
  return (
    paid &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date())
  );
}

export interface BrowseHit {
  id: string;
  topic: string;
  phases: KnowledgeEntry["phases"];
  text: string;
  /** Video fields are only sent to paying users. */
  videoId?: string;
  videoTitle?: string;
  channel?: string;
  start?: number;
}

export function browseKnowledge(
  entries: KnowledgeEntry[],
  user: UserLike | null,
  query: string,
  phase?: string,
) {
  const matches = filterKnowledge(entries, query, phase);
  if (hasPaidKnowledgeAccess(user)) {
    return {
      entries: matches as BrowseHit[],
      total: matches.length,
      limited: false,
    };
  }
  const teaser = matches.slice(0, FREE_BROWSE_LIMIT).map((e) => ({
    id: e.id,
    topic: e.topic,
    phases: e.phases,
    text:
      e.text.length > TEASER_CHARS
        ? `${e.text.slice(0, TEASER_CHARS).trimEnd()}\u2026`
        : e.text,
  }));
  return {
    entries: teaser as BrowseHit[],
    total: matches.length,
    limited: true,
  };
}
