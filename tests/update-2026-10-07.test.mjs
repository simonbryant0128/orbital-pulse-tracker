import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("October 7 publishes three verified events exactly once", async () => {
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
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], approved[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  }
  assert.equal(published.events.length, 93);
});

test("October 7 refreshes the current schedule without changing deployment totals", async () => {
  const [published, schedule, constellations, companies, meta] = await Promise.all([
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.equal(schedule.items.length, 15);
  assert.equal(schedule.lastVerified, "2026-10-07");
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-15-25-target-20260920"), false);
  for (const id of [
    "sx-crew12-undock-return-20261007",
    "sx-sda-tranche1-4-window-20261007",
    "sx-starlink-next-window-20261007",
  ]) {
    assert.ok(schedule.items.some((item) => item.id === id));
  }
  assert.match(schedule.items.find((item) => item.id === "sx-starlink-next-window-20261007").window, /10\/11 07:00–11:00/);

  assert.equal(constellations.lastVerified, "2026-10-07");
  assert.equal(constellations.items.length, 7);
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-10-07"));
  const starlink = constellations.items.find((item) => item.id === "starlink");
  assert.equal(starlink.current, 10971);
  assert.equal(starlink.currentAsOf, "2026-08-12");
  assert.equal(starlink.deployment.nextLaunchDate, "2026-10-11");
  assert.match(starlink.deployment.nextMission, /官方未公布批次代號/);
  assert.match(starlink.deployment.nextStatus, /衛星顆數未公開/);

  const crew = published.events.find((item) => item.id === "sx-crew12-undock-return-20261007");
  const sda = published.events.find((item) => item.id === "sx-sda-tranche1-4-window-20261007");
  const nextStarlink = published.events.find((item) => item.id === "sx-starlink-next-window-20261007");
  assert.ok(crew.sources.every((source) => new URL(source.url).hostname === "www.nasa.gov"));
  assert.ok(sda.sources.every((source) => new URL(source.url).hostname === "www.spacex.com"));
  assert.ok(nextStarlink.sources.every((source) => new URL(source.url).hostname === "www.spacex.com"));
  assert.match(sda.detail, /不調整任何衛星部署總量/);
  assert.match(nextStarlink.detail, /不預先增加部署總量/);

  assert.match(companies.items.find((item) => item.id === "spacex").status, /Crew-12/);
  assert.equal(companies.lastVerified, "2026-10-07");
  assert.equal(meta.lastVerified, "2026-10-07");
});
