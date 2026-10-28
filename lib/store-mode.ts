/**
 * Store mode (Google Play build). With EXPO_PUBLIC_STORE_MODE=1 the app hides everything that
 * could count as facilitating or advertising cannabis sales: seed search links, shop and club
 * radar, marketplace, vendor portal, auctions and featured vendor products. Free prize draws
 * stay. See docs/PLAY_STORE_BUILD.md.
 */
export function isStoreMode(
  value: string | undefined = process.env.EXPO_PUBLIC_STORE_MODE,
): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export const STORE_MODE = isStoreMode();
