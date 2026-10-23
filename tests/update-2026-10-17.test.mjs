import assert from "node:assert/strict";
import { readHistoricalJson as readJson } from "./helpers/verified-baseline.mjs";
import test from "node:test";


test("October 17 publishes Blue Origin infrastructure and refreshes Amazon Leo planning", async () => {
  const [batch, published, schedule, constellations, companies, meta] = await Promise.all([
    readJson("pending/2026-10-17-approved.json"),
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.equal(batch.events.length, 2);
  assert.ok(published.lastVerified >= "2026-10-17");
  assert.ok(published.events.length >= 103);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-17");
    assert.equal(published.events.filter((event) => event.id === approved.id).length, 1);
  }
  const blue = published.events.find((event) => event.id === "bo-florida-high-cadence-infrastructure-20261016");
  assert.match(blue.detail, /150 個 New Glenn 9×4 上級/);
  assert.match(blue.detail, /每年 12 次提高至 50 次/);

  assert.equal(schedule.lastVerified, meta.lastVerified);
  assert.equal(schedule.items.length, 16);
  assert.equal(schedule.items.some((item) => item.id === "amazon-leo-vulcan"), false);
  const le04 = schedule.items.find((item) => item.id === "amazon-leo-le04-net-20261123");
  assert.match(le04.window, /2026-11-23/);
  assert.equal(le04.vehicle, "Ariane 64");

  assert.equal(constellations.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  const amazon = constellations.items.find((item) => item.id === "amazon-leo");
  assert.equal(amazon.current, 396);
  assert.equal(amazon.currentAsOf, "2026-10-14");
  assert.equal(amazon.deployment.nextLaunchDate, "2026-11-23");
  assert.match(amazon.deployment.nextMission, /36 顆/);

  assert.equal(companies.lastVerified, meta.lastVerified);
  assert.match(companies.items.find((item) => item.id === "blue-origin").status, /高頻/);
  assert.match(companies.items.find((item) => item.id === "amazon-leo").status, /11\/23/);
  assert.ok(published.lastVerified >= meta.lastVerified);
});
