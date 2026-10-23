import assert from "node:assert/strict";
import { readHistoricalJson as readJson } from "./helpers/verified-baseline.mjs";
import test from "node:test";


test("October 7 historical snapshot keeps three stable event IDs", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-10-07-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.events.length, 3);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-07");
    const matches = published.events.filter((event) => event.id === approved.id);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].company, approved.company);
    assert.ok(matches[0].detail.length > 80);
    assert.ok(matches[0].sources.length >= 1);
  }
  assert.ok(published.events.length >= 93);
});

test("October 7 refreshes the current schedule without changing deployment totals", async () => {
  const [published, schedule, constellations, companies, meta] = await Promise.all([
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.ok(schedule.items.length >= 15);
  assert.ok(schedule.lastVerified >= "2026-10-07");
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-15-25-target-20260920"), false);
  assert.equal(schedule.items.some((item) => item.id === "sx-crew12-undock-return-20261007"), false);
  assert.ok(!schedule.items.some((item) => item.id === "sx-sda-tranche1-4-window-20261007"));
  assert.ok(schedule.items.some((item) => item.id === "sx-starlink-27-window-20261020"));

  assert.ok(constellations.lastVerified >= "2026-10-07");
  assert.equal(constellations.items.length, 7);
  assert.ok(constellations.items.every((item) => item.lastChecked >= "2026-10-07"));
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.ok(starlink.deployment.nextLaunchDate >= "2026-10-11");
  assert.match(starlink.deployment.nextMission, /27 顆/);
  assert.match(starlink.deployment.nextStatus, /第二班官方窗口/);

  const crew = published.events.find((item) => item.id === "sx-crew12-undock-return-20261007");
  const sda = published.events.find((item) => item.id === "sx-sda-tranche1-4-window-20261007");
  const nextStarlink = published.events.find((item) => item.id === "sx-starlink-next-window-20261007");
  assert.ok(crew.sources.every((source) => new URL(source.url).hostname === "www.nasa.gov"));
  assert.ok(sda.sources.every((source) => new URL(source.url).hostname === "www.spacex.com"));
  assert.ok(nextStarlink.sources.every((source) => new URL(source.url).hostname === "www.spacex.com"));
  assert.match(sda.detail, /不自行推算衛星部署數/);
  assert.match(nextStarlink.detail, /不把它加到部署總量/);

  assert.match(companies.items.find((item) => item.id === "spacex").status, /CRS-35/);
  assert.ok(companies.lastVerified >= "2026-10-07");
  assert.ok(meta.lastVerified >= "2026-10-07");
});
