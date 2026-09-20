import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const batch = JSON.parse(await readFile(new URL("../content/pending/2026-09-20-approved.json", import.meta.url), "utf8"));

test("September 20 staging contains only verified pending events with stable unique IDs", () => {
  assert.equal(batch.state, "staged-not-published");
  assert.equal(batch.range, "A79:Q82");
  assert.equal(batch.events.length, 4);
  assert.equal(new Set(batch.events.map((e) => e.id)).size, 4);
  for (const event of batch.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    assert.equal(event.checkedDate, "2026-09-20");
    for (const key of ["id", "date", "company", "program", "category", "status", "tone", "title", "summary", "detail"]) {
      assert.ok(event[key], `Missing ${key} for ${event.id}`);
    }
    assert.match(event.date, /^2026-09-\d{2}$/);
    assert.ok(event.sources.length);
    for (const source of event.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(["www.spacex.com", "x.com", "rocketlabcorp.com", "www.viasat.com"].includes(url.hostname));
      if (url.hostname === "x.com") assert.match(url.pathname, /^\/SpaceX\/status\/\d+$/);
    }
  }
});

test("September 20 staging preserves deployment and time-zone caveats", () => {
  const byId = (id) => batch.events.find((e) => e.id === id);
  const starlink = byId("sx-starlink-15-27-deployed-20260920");
  assert.match(starlink.detail, /09:47/);
  assert.match(starlink.detail, /10:50/);
  assert.match(starlink.detail, /27 顆是本次部署量，不是目前在軌工作中淨增數/);
  assert.match(starlink.detail, /首節執行第 17 次飛行/);
  assert.match(starlink.detail, /整流罩首次達到第 40 次飛行/);
  const electron = byId("rklb-owl-by-the-dozen-20260919");
  assert.match(electron.detail, /572 公里/);
  assert.match(electron.detail, /不代表已核實 12 顆同時在軌工作/);
  const next = byId("sx-starlink-15-25-target-20260920");
  assert.match(next.detail, /2026 年 9 月 30 日/);
  assert.match(next.detail, /沒有提供升空時刻或日期適用時區/);
  assert.match(next.detail, /不是已完成部署/);
  assert.match(byId("vsat-viasat3-f2-service-20260917").detail, /並非過去 24 小時新事件/);
});

test("September 20 staged data is not silently included in the currently published content", async () => {
  const published = JSON.parse(await readFile(new URL("../content/events.json", import.meta.url), "utf8"));
  const ids = new Set(published.events.map((e) => e.id));
  for (const event of batch.events) assert.ok(!ids.has(event.id));
  assert.ok(!batch.events.some((e) => e.id.includes("review")));
});
