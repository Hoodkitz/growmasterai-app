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

// Permits are issued by each Land, and there is no central public register.
// Instead of listing clubs we cannot verify, link to a search per Land.
export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

export function clubSearchUrl(land: string): string {
  const q = `Anbauvereinigungen Cannabis ${land} Erlaubnis Behörde Verzeichnis`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
