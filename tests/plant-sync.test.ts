import { describe, expect, it } from "vitest";
import { mergePlants, type SyncPlant } from "../shared/plant-sync";

const p = (id: string, updatedAt: string, name = id): SyncPlant => ({
  id, name, strain: "", phase: "seedling", startDate: "2026-01-01T00:00:00.000Z", updatedAt,
});
const empty = { plants: [], tombstones: {} };

describe("mergePlants", () => {
  it("union of disjoint plants; local-only gets pushed", () => {
    const r = mergePlants({ ...empty, plants: [p("a", "2026-02-01T00:00:00Z")] }, { ...empty, plants: [p("b", "2026-02-01T00:00:00Z")] });
    expect(r.plants.map((x) => x.id).sort()).toEqual(["a", "b"]);
    expect(r.toPush.plants.map((x) => x.id)).toEqual(["a"]);
  });
  it("newer side wins", () => {
    const r = mergePlants(
      { ...empty, plants: [p("a", "2026-02-02T00:00:00Z", "local")] },
      { ...empty, plants: [p("a", "2026-02-01T00:00:00Z", "remote")] },
    );
    expect(r.plants[0].name).toBe("local");
    expect(r.toPush.plants).toHaveLength(1);
    const r2 = mergePlants(
      { ...empty, plants: [p("a", "2026-02-01T00:00:00Z", "local")] },
      { ...empty, plants: [p("a", "2026-02-02T00:00:00Z", "remote")] },
    );
    expect(r2.plants[0].name).toBe("remote");
    expect(r2.toPush.plants).toHaveLength(0);
  });
  it("identical state yields no pushes", () => {
    const s = { ...empty, plants: [p("a", "2026-02-01T00:00:00Z")] };
    expect(mergePlants(s, s).toPush).toEqual({ plants: [], tombstones: {} });
  });
  it("newer deletion removes the plant; newer edit resurrects it", () => {
    const del = mergePlants({ plants: [], tombstones: { a: "2026-03-01T00:00:00Z" } }, { ...empty, plants: [p("a", "2026-02-01T00:00:00Z")] });
    expect(del.plants).toHaveLength(0);
    expect(del.tombstones).toEqual({ a: "2026-03-01T00:00:00Z" });
    expect(del.toPush.tombstones).toEqual({ a: "2026-03-01T00:00:00Z" });
    const res = mergePlants({ ...empty, plants: [p("a", "2026-04-01T00:00:00Z")] }, { plants: [], tombstones: { a: "2026-03-01T00:00:00Z" } });
    expect(res.plants).toHaveLength(1);
    expect(res.tombstones).toEqual({});
  });
  it("remote deletion propagates to local without push; tie prefers deletion", () => {
    const r = mergePlants({ ...empty, plants: [p("a", "2026-03-01T00:00:00Z")] }, { plants: [], tombstones: { a: "2026-03-01T00:00:00Z" } });
    expect(r.plants).toHaveLength(0);
    expect(r.toPush.tombstones).toEqual({});
  });
  it("falls back to createdAt/startDate when updatedAt is missing", () => {
    const legacy: SyncPlant = { id: "a", name: "legacy", strain: "", phase: "seedling", startDate: "2026-01-01T00:00:00Z", createdAt: "2026-01-05T00:00:00Z" };
    const r = mergePlants({ ...empty, plants: [legacy] }, { ...empty, plants: [p("a", "2026-01-04T00:00:00Z", "remote")] });
    expect(r.plants[0].name).toBe("legacy");
  });
});
