import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}.json`, import.meta.url), "utf8"));

test("publishes each approved event once and retains prior schedules in the event history", async () => {
  const [batch, events, schedule, meta] = await Promise.all([
    readJson("pending/2026-11-25-approved"), readJson("events"), readJson("schedule"), readJson("meta"),
  ]);
  assert.ok(meta.lastVerified >= batch.checkedDate);
  assert.equal(events.lastVerified, meta.lastVerified);
  assert.equal(batch.events.length, 5);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    const actual = events.events.filter((candidate) => candidate.id === event.id);
    assert.equal(actual.length, 1);
    assert.ok(actual[0].detail);
    assert.ok(actual[0].sources.every(({ url, type }) => url.startsWith("https://") && type === "官方"));
  }
  for (const id of ["amzn-leo-lv01-schedule-20261113", "rklb-electron-100-window-20261114", "sx-starship-flight15-window-20261114"]) {
    assert.ok(events.events.some((event) => event.id === id), id);
  }
  for (const id of ["amazon-leo-lv01-20261114", "amazon-leo-le04-net-20261123", "rklb-mountain-god-rises-20261114", "sx-starship-flight15-20261114"]) {
    assert.ok(!schedule.items.some((item) => item.id === id), id);
  }
});

test("counts only confirmed Amazon Leo deployments, not the lost LV-01 payload", async () => {
  const data = await readJson("constellations");
  const leo = data.items.find(({ id }) => id === "amazon-leo");
  assert.equal(leo.breakdown.find(({ label }) => label === "LE04").value, 36);
  assert.ok(!leo.breakdown.some(({ label }) => /LV.?01/.test(label)));
  assert.equal(leo.current, leo.breakdown.reduce((sum, item) => sum + item.value, 0));
  if (data.lastVerified === "2026-11-25") {
    assert.equal(leo.current, 432);
    assert.equal(leo.deployment.nextLaunchDate, null);
  }
});
