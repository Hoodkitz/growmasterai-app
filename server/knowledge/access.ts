import { filterKnowledge } from "../../lib/knowledge-filter";
import type { KnowledgeEntry } from "./types";

/** Free users see this many hits per search. */
export const FREE_BROWSE_LIMIT = 3;
const TEASER_CHARS = 140;

interface UserLike {
  role?: string | null;
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: Date | null;
}

export function hasPaidKnowledgeAccess(user: UserLike | null): boolean {
  if (!user) return false;
  // Owner override via the server-side role, never via an (unverified) email.
  if (user.role === "admin") return true;
  const paid =
    user.subscriptionTier === "premium" || user.subscriptionTier === "pro";
  return (
    paid &&
    (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date())
  );
}

/** Free users get a few full entries per phase (plant-card tips), paying users all. */
export const FREE_PHASE_LIMIT = 5;

export function toTeaser(e: KnowledgeEntry): BrowseHit {
  return {
    id: e.id,
    topic: e.topic,
    phases: e.phases,
    text:
      e.text.length > TEASER_CHARS
        ? `${e.text.slice(0, TEASER_CHARS).trimEnd()}\u2026`
        : e.text,
  };
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
  const teaser = matches.slice(0, FREE_BROWSE_LIMIT).map(toTeaser);
  return {
    entries: teaser as BrowseHit[],
    total: matches.length,
    limited: true,
  };
}
