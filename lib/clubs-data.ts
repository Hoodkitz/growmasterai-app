// Hand-maintained list of Cannabis Social Clubs (Anbauvereinigungen).
// There is no reliable open data source, so entries are added here only after
// checking them manually. Never add placeholder or invented clubs.
export interface Club {
  name: string;
  city: string;
  website?: string; // http(s) only
  note?: string;
}

export const CLUBS: Club[] = [];

export const CLUB_SEARCH_URL =
  "https://www.google.com/search?q=Cannabis+Anbauvereinigung+in+meiner+N%C3%A4he";

export function safeClubUrl(value?: string): string | undefined {
  const url = value?.trim();
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

export function sortedClubs(clubs: Club[] = CLUBS): Club[] {
  return [...clubs].sort(
    (a, b) =>
      a.city.localeCompare(b.city, "de") || a.name.localeCompare(b.name, "de"),
  );
}
