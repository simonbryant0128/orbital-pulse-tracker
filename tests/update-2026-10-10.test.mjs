import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("October 10 publishes six new events and three verified lifecycle updates", async () => {
  const [batch, published, manual] = await Promise.all([
    readJson("pending/2026-10-10-approved.json"),
    readJson("events.json"),
    readJson("pending/2026-10-10-manual-review.json"),
  ]);
  assert.equal(batch.events.length, 9);
  assert.equal(manual.events.length, 1);
  assert.equal(manual.events[0].publicationStatus, "不發布");
  assert.equal(published.lastVerified, "2026-10-10");
  assert.equal(published.events.length, 99);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-10");
    assert.equal(published.events.filter((event) => event.id === approved.id).length, 1);
  }
  assert.equal(published.events.some((event) => event.id === manual.events[0].id), false);
});

test("October 10 refreshes schedules while preserving deployment totals", async () => {
  const [schedule, constellations, companies, meta] = await Promise.all([
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);
  assert.equal(schedule.lastVerified, "2026-10-10");
  assert.equal(schedule.items.length, 15);
  assert.equal(schedule.items.some((item) => item.id === "sx-crew12-undock-return-20261007"), false);
  assert.match(schedule.items.find((item) => item.id === "sx-sda-tranche1-4-window-20261007").window, /10\/10 00:39/);
  assert.match(schedule.items.find((item) => item.id === "sx-starlink-next-window-20261007").window, /10\/13 07:00–11:00/);
  assert.ok(schedule.items.some((item) => item.id === "sx-crs35-target-20261007"));

  assert.equal(constellations.lastVerified, "2026-10-10");
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-10-10"));
  const starlink = constellations.items.find((item) => item.id === "starlink");
  const amazon = constellations.items.find((item) => item.id === "amazon-leo");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.deployment.nextLaunchDate, "2026-10-13");
  assert.equal(amazon.current, 396);
  assert.match(amazon.deployment.nextLaunchDisplay, /未來數週/);
  assert.match(amazon.deployment.nextStatus, /500\+ 與 396/);

  assert.equal(companies.lastVerified, "2026-10-10");
  assert.match(companies.items.find((item) => item.id === "blue-origin").status, /Constellation Park/);
  assert.match(companies.items.find((item) => item.id === "firefly-aerospace").status, /3,100 萬美元/);
  assert.match(companies.items.find((item) => item.id === "blacksky").status, /試點合約/);
  assert.equal(meta.lastVerified, "2026-10-10");
});
