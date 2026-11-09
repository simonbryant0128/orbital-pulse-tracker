import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("November 9 publishes eight official-source recovery events exactly once", async () => {
  const [batch, events, meta] = await Promise.all([
    readJson("pending/2026-11-09-approved.json"),
    readJson("events.json"),
    readJson("meta.json"),
  ]);
  assert.equal(meta.lastVerified, "2026-11-09");
  assert.equal(events.lastVerified, meta.lastVerified);
  assert.equal(batch.events.length, 8);
  assert.equal(batch.manualReviewCount, 3);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(events.events.filter((event) => event.id === approved.id).length, 1);
  }
  const flight = events.events.find((event) => event.id === "sx-starship-flight15-window-20261114");
  assert.match(flight.detail, /待監管核准/);
  assert.match(flight.detail, /26 顆 Starlink V3/);
  const clps = events.events.find((event) => event.id === "nasa-clps2-tracked-providers-20261107");
  assert.match(clps.detail, /不保證個別公司/);
});

test("November 9 advances next deployments without pre-counting planned satellites", async () => {
  const [constellations, schedule, programs, companies, meta] = await Promise.all([
    readJson("constellations.json"),
    readJson("schedule.json"),
    readJson("programs.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  for (const data of [constellations, schedule, companies]) assert.equal(data.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.deployment.nextLaunchDate, "2026-11-14");
  assert.match(starlink.deployment.nextMission, /26 顆/);
  const amazon = constellations.items.find((item) => item.id === "amazon-leo");
  assert.equal(amazon.current, 396);
  assert.match(amazon.deployment.nextMission, /40 顆/);
  assert.ok(schedule.items.some((item) => item.id === "sx-starship-flight15-20261114"));
  assert.ok(schedule.items.some((item) => item.id === "amazon-leo-lv01-20261114"));
  assert.equal(programs.items.find((item) => item.id === "starship").stages.find((stage) => stage.label === "Flight 15 發射").state, "upcoming");
});
