import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const json = async (name) => JSON.parse(await readFile(new URL(`../content/${name}.json`, import.meta.url), "utf8"));
const [published, approved, latest, today, manual, constellations, schedule, programs, companies, meta] = await Promise.all(
  ["events", "pending/2026-10-21-recovery-approved", "pending/2026-10-23-approved", "pending/2026-10-24-approved", "pending/2026-10-21-recovery-manual-review", "constellations", "schedule", "programs", "companies", "meta"].map(json),
);

test("recovery integrates 14 new IDs and three lifecycle updates exactly once", () => {
  assert.equal(published.events.length, 117);
  assert.equal(approved.events.length, 15);
  assert.equal(new Set(published.events.map(e => e.id)).size, published.events.length);
  for (const event of approved.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    const found = published.events.filter(e => e.id === event.id);
    assert.equal(found.length, 1);
    for (const key of ["company", "program"]) assert.deepEqual(found[0][key], event[key]);
  }
  assert.equal(latest.events.length, 2);
  for (const event of latest.events) {
    assert.equal(event.reviewStatus, "自動查證");
    assert.equal(event.publicationStatus, "待同步");
    const found = published.events.filter(e => e.id === event.id);
    assert.equal(found.length, 1);
    for (const key of ["company", "program"]) assert.deepEqual(found[0][key], event[key]);
  }
  for (const event of today.events) assert.deepEqual(published.events.find(e => e.id === event.id).status, event.status);
  for (const previous of approved.previousStates) assert.equal(published.events.filter(e => e.id === previous.id).length, 1);
  assert.equal(published.events.find(e => e.id === "rklb-neutron-q4-20260226").status, "Q4 2026", "keep the earlier announcement as history");
  assert.match(programs.items.find(p => p.id === "neutron").next, /2027/);
});

test("unconfirmed outcomes and conflicting windows never enter published events", () => {
  assert.equal(manual.events.length, 1);
  for (const event of manual.events) {
    assert.equal(event.reviewStatus, "待人工確認");
    assert.equal(event.publicationStatus, "不發布");
    assert.ok(!published.events.some(e => e.id === event.id));
    assert.ok(!schedule.items.some(e => e.id === event.id));
  }
  for (const id of approved.retiredUpcomingIds) assert.ok(!schedule.items.some(e => e.id === id));
  for (const id of ["sx-starlink-15-27-faa-window-20260913", "vsat-equatys-binding-agreement-review-20260914"]) assert.ok(!published.events.some(e => e.id === id));
  assert.ok(!schedule.items.some(e => e.id === "rklb-hawkeye-window-20261023"));
  assert.equal(published.events.find(e => e.id === "rklb-hawkeye-window-20261023").tone, "positive");
  for (const id of latest.resolvedReviewIds) assert.ok(!manual.events.some(e => e.id === id));
});

test("deployment accounting separates verified additions, lower bounds and plans", () => {
  const byId = id => constellations.items.find(e => e.id === id);
  assert.equal(byId("starlink").current, 10971);
  assert.equal(byId("starlink").currentAsOf, "2026-08-12");
  assert.equal(byId("starlink").deployment.nextLaunchDate, "2026-10-27");
  assert.equal(byId("planet-pelican").current, 11);
  assert.equal(byId("planet-pelican").breakdown.reduce((a,r) => a+r.value,0), 11);
  assert.equal(byId("spire-2026").current, 32);
  assert.match(byId("spire-2026").displayValue, /至少/);
  assert.match(byId("spire-2026").metric, /下限/);
  assert.equal(byId("amazon-leo").current, 396);
  assert.equal(byId("ast-spacemobile").current, 13);
  assert.equal(byId("blacksky-gen3").current, 5);
  assert.equal(byId("globalstar-hibleo4").current, 8);
  assert.equal(byId("globalstar-hibleo4").deployment.nextLaunchDate, null);
  assert.equal(byId("globalstar-hibleo4").deployment.nextLaunchDisplay, "待官方公告");
});

test("current views use one verification date and preserve official timing precision", () => {
  assert.equal(meta.lastVerified, "2026-10-25");
  for (const data of [published, constellations, schedule, companies]) assert.equal(data.lastVerified, meta.lastVerified);
  assert.ok(constellations.items.every(e => e.lastChecked === meta.lastVerified));
  assert.equal(companies.items.length, 13);
  assert.equal(schedule.items.length, 17);
  assert.match(schedule.items.find(e => e.id === "sx-starlink-15-16-20261027").window, /12:45–16:45/);
  assert.match(schedule.items.find(e => e.id === "neutron-first-flight-q4").window, /2027/);
  assert.match(schedule.items.find(e => e.id === "fly-moonfall-launch-readiness-2028").window, /非確定發射日/);
  assert.match(published.events.find(e => e.id === "asts-europe-mno-spectrum-loi-20261019").detail, /不等於競標得標/);
  assert.match(published.events.find(e => e.id === "asts-service-readiness-20261020").detail, /不代表已有 50 顆在軌/);
});
