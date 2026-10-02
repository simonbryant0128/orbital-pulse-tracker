import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("September 29 publishes the Flight 14 lifecycle update", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-09-29-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.range, "A73:Q73");
  assert.equal(batch.events.length, 1);
  const event = published.events.find((item) => item.id === batch.events[0].id);
  assert.ok(event);
  assert.equal(event.date, "2026-09-28");
  assert.match(event.status, /官方列入已完成任務/);
  assert.match(event.detail, /Completed missions/);
  assert.match(event.detail, /不調增 Starlink 部署總量/);
  assert.equal(published.events.length, 89);
});

test("Flight 14 leaves the future schedule and advances the Starship program", async () => {
  const [schedule, programs, companies] = await Promise.all([
    readJson("schedule.json"),
    readJson("programs.json"),
    readJson("companies.json"),
  ]);
  assert.equal(schedule.items.length, 13);
  assert.equal(schedule.items.some((item) => item.id === "sx-starship-flight14-spacex-window-review-20260916"), false);
  const program = programs.items.find((item) => item.id === "starship");
  assert.match(program.stages.at(-1).state, /complete/);
  assert.match(program.detail, /不推定 26 顆 Starlink V3/);
  const spacex = companies.items.find((item) => item.id === "spacex");
  assert.match(spacex.status, /Crew-13.*Transporter-18/);
});

test("deployment totals remain unchanged after the September 29 recheck", async () => {
  const constellations = await readJson("constellations.json");
  assert.equal(constellations.lastVerified, "2026-10-02");
  assert.equal(constellations.items.length, 7);
  assert.ok(constellations.items.every((item) => item.lastChecked === "2026-10-02"));
});
