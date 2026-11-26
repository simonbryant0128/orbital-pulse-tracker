import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (name) => JSON.parse(await readFile(new URL(`../content/${name}.json`, import.meta.url), "utf8"));

test("publishes the verified contract exactly once", async () => {
  const [batch, events, meta] = await Promise.all([
    readJson("pending/2026-11-26-approved"), readJson("events"), readJson("meta"),
  ]);
  assert.equal(batch.events.length, 1);
  assert.ok(meta.lastVerified >= batch.checkedDate);
  for (const { id, reviewStatus, publicationStatus } of batch.events) {
    assert.equal(reviewStatus, "自動查證");
    assert.equal(publicationStatus, "待同步");
    const matching = events.events.filter((event) => event.id === id);
    assert.equal(matching.length, 1);
    assert.equal(matching[0].sources.length, 2);
    assert.ok(matching[0].sources.every(({ url, type }) => url.startsWith("https://") && type === "官方"));
  }
  const contract = events.events.find(({ id }) => id === "bo-endurosat-new-glenn-deal-20261125");
  assert.match(contract.status, /首班 2029 年/);
  assert.match(contract.detail, /未公布第二班年份/);
});

test("represents the contract as a year-only window without implying a deployment", async () => {
  const { lastVerified, items } = await readJson("schedule");
  if (lastVerified !== "2026-11-26") return;
  const first = items.find(({ id }) => id === "bo-endurosat-new-glenn-first-2029");
  assert.equal(first?.window, "2029 年（未定日）");
  assert.equal(first?.bucket, "90plus");
});
