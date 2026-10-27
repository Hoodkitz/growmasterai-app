import type { Strain } from "./strains-data";

/**
 * Additional strains, each taken from the breeder's own product page (see `source` on the Strain
 * type for the rules). Kept in its own file so content batches do not collide with the core list.
 */
export const EXTRA_STRAINS: Strain[] = [];
