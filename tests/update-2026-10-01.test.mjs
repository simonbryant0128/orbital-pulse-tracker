import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}`, import.meta.url), "utf8"));

test("October 1 publishes one verified event and advances two existing events", async () => {
  const [batch, published] = await Promise.all([
    readJson("pending/2026-10-01-approved.json"),
    readJson("events.json"),
  ]);
  assert.equal(batch.events.length, 3);
  assert.equal(new Set(batch.events.map((event) => event.id)).size, 3);
  for (const approved of batch.events) {
    assert.equal(approved.reviewStatus, "自動查證");
    assert.equal(approved.publicationStatus, "待同步");
    assert.equal(approved.checkedDate, "2026-10-01");
    const matches = published.events.filter((event) => event.id === approved.id);
    assert.equal(matches.length, 1);
    for (const key of ["date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.equal(matches[0][key], approved[key]);
    }
    assert.deepEqual(matches[0].sources.map((source) => source.url), approved.sources.map((source) => source.url));
  }
  assert.equal(published.events.length, 89);
});

test("October 1 keeps deployment totals fixed and uses official mission windows", async () => {
  const [schedule, constellations, companies] = await Promise.all([
    readJson("schedule.json"),
    readJson("constellations.json"),
    readJson("companies.json"),
  ]);
  assert.equal(schedule.items.length, 15);
  const crew = schedule.items.find((item) => item.id === "sx-crew13-faa-window-20260924");
  assert.match(crew.confidence, /通過發射就緒審查/);
  assert.match(crew.window, /23:10/);
  const transporter = schedule.items.find((item) => item.id === "sx-transporter18-faa-window-20260924");
  assert.match(transporter.window, /02:18/);
  assert.equal(transporter.source, "https://www.spacex.com/launches/transporter18/");
  const lunar = schedule.items.find((item) => item.id === "fly-starcloud-lunar-ai-compute-20260930");
  assert.equal(lunar.window, "NET 2028（未定日）");
  assert.equal(constellations.items.length, 7);
  assert.equal(constellations.lastVerified, "2026-10-01");
  assert.match(companies.items.find((item) => item.id === "firefly-aerospace").status, /SC-1L/);
});
