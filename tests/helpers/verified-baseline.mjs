import { readFile } from "node:fs/promises";

// Historical batches must not freeze the live dashboard at an expired window.
// These mutable views use the last verified pre-recovery snapshot; the recovery
// suite validates the current dashboard and all preserved event IDs.
export async function readHistoricalJson(name) {
  const mutable = new Set(["constellations.json", "schedule.json", "companies.json", "meta.json", "programs.json"]);
  const path = mutable.has(name) ? `../fixtures/2026-10-18/${name}` : `../../content/${name}`;
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}
