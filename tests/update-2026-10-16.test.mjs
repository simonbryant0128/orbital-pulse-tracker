import assert from "node:assert/strict";
import { readHistoricalJson as readJson } from "./helpers/verified-baseline.mjs";
import test from "node:test";


test("October 16 publishes three new events and three verified lifecycle updates", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-10-16-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.events.length, 6);
  assert.ok(published.lastVerified >= "2026-10-16");
  assert.ok(published.events.length >= 102);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-16");
    assert.equal(published.events.filter((event) => event.id === approved.id).length, 1);
  }
  assert.equal(new Set(published.events.map((event) => event.id)).size, published.events.length);
  assert.equal(published.events.find((event) => event.id === "sx-sda-tranche1-4-window-20261007").status, "已完成");
  assert.match(published.events.find((event) => event.id === "sx-crs35-target-20261007").status, /完成 ISS 對接/);
});

test("October 16 refreshes schedules and next deployment while preserving totals", async () => {
  const [schedule, constellations, companies, meta] = await Promise.all([
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  assert.ok(schedule.lastVerified >= "2026-10-16");
  assert.equal(schedule.items.length, 16);
  for (const id of ["sx-sda-tranche1-4-window-20261007", "sx-starlink-next-window-20261007", "sx-crs35-target-20261007"]) {
    assert.equal(schedule.items.some((item) => item.id === id), false);
  }
  for (const id of ["sx-ussf481-window-20261015", "sx-bandwagon5-window-20261019", "sx-starlink-27-window-20261020", "sx-starlink-window-20261024"]) {
    assert.equal(schedule.items.filter((item) => item.id === id).length, 1);
  }

  assert.ok(constellations.lastVerified >= "2026-10-16");
  assert.ok(constellations.items.every((item) => item.lastChecked >= "2026-10-16"));
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.deployment.nextLaunchDate, "2026-10-21");
  assert.match(starlink.deployment.nextMission, /27 顆/);
  const expectedTotals = new Map([
    ["amazon-leo", 396],
    ["ast-spacemobile", 13],
    ["planet-pelican", 10],
    ["blacksky-gen3", 5],
    ["spire-2026", 29],
    ["globalstar-hibleo4", 8],
  ]);
  for (const [id, value] of expectedTotals) assert.equal(constellations.items.find((item) => item.id === id).current, value);

  assert.ok(companies.lastVerified >= "2026-10-16");
  assert.match(companies.items.find((item) => item.id === "spacex").status, /CRS-35/);
  assert.match(companies.items.find((item) => item.id === "blacksky").status, /HEO/);
  assert.ok(meta.lastVerified >= "2026-10-16");
});
