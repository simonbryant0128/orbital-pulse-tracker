import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));
}

test("October 25 refreshes the official-source audit without inventing new events", async () => {
  const [events, schedule, constellations, companies, meta] = await Promise.all([
    readJson("events.json"),
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
    readJson("meta.json"),
  ]);

  assert.equal(meta.lastVerified, "2026-10-28");
  assert.equal(events.lastVerified, meta.lastVerified);
  assert.equal(events.events.length, 118);
  assert.equal(schedule.lastVerified, meta.lastVerified);
  assert.equal(constellations.lastVerified, meta.lastVerified);
  assert.equal(companies.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every((item) => item.lastChecked === meta.lastVerified));

  const next = schedule.items.find((item) => item.id === "sx-starlink-window-20261030");
  assert.match(next.mission, /27 顆/);
  assert.match(next.window, /10\/30 12:02–16:02/);

  const starlink = events.events.find((event) => event.id === "sx-starlink-next-window-20261007");
  const hawkeye = events.events.find((event) => event.id === "rklb-hawkeye-window-20261023");
  assert.match(starlink.title, /完成 Starlink 15-15/);
  assert.match(hawkeye.title, /成功部署三顆/);
});
