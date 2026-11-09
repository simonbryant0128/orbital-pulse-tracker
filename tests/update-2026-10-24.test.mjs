import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("October 24 publishes Starlink and HawkEye outcomes with refreshed next launches", async () => {
  const [batch, events, schedule, constellations, companies, meta] = await Promise.all([
    readJson("pending/2026-10-24-approved.json"),
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.ok(meta.lastVerified >= "2026-11-03");
  assert.equal(events.lastVerified, meta.lastVerified);
  assert.ok(events.events.length >= 119);
  assert.equal(batch.events.length, 3);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-24");
    assert.equal(events.events.filter((event) => event.id === approved.id).length, 1);
  }

  const starlink = events.events.find((event) => event.id === "sx-starlink-next-window-20261007");
  assert.match(starlink.title, /完成 Starlink 15-15/);
  assert.match(starlink.detail, /27 顆/);
  assert.match(starlink.detail, /10 月 27 日 12:45–16:45/);

  const hawkeye = events.events.find((event) => event.id === "rklb-hawkeye-window-20261023");
  assert.equal(hawkeye.tone, "positive");
  assert.match(hawkeye.detail, /三顆.*部署/);
  assert.match(hawkeye.detail, /第 98 次 Electron/);

  assert.equal(schedule.lastVerified, meta.lastVerified);
  assert.equal(schedule.items.some((item) => item.id === "rklb-hawkeye-window-20261023"), false);
  assert.equal(schedule.items.some((item) => item.id === "sx-starlink-window-20261024"), false);
  const next = schedule.items.find((item) => item.id === "sx-starship-flight15-20261114");
  assert.match(next.mission, /Flight 15/);
  assert.match(next.window, /11-14 06:45–08:00/);

  assert.equal(constellations.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));
  const starlinkDeployment = constellations.items.find((item) => item.id === "starlink").deployment;
  assert.equal(starlinkDeployment.nextLaunchDate, "2026-11-14");
  assert.equal(starlinkDeployment.nextSource, "https://www.spacex.com/launches/starship-flight-15");

  assert.equal(companies.lastVerified, meta.lastVerified);
  assert.match(companies.items.find((item) => item.id === "spacex").status, /Flight 15/);
  assert.match(companies.items.find((item) => item.id === "rocket-lab").status, /Electron/);
});
