import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const requiredEventFields = [
  "id",
  "date",
  "company",
  "program",
  "category",
  "status",
  "tone",
  "title",
  "summary",
  "sources",
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, `file://${root}/`), "utf8"));
}

function fail(message) {
  throw new Error(`Content validation failed: ${message}`);
}

const [eventsData, constellationsData, programsData, metaData] = await Promise.all([
  readJson("content/events.json"),
  readJson("content/constellations.json"),
  readJson("content/programs.json"),
  readJson("content/meta.json"),
]);

if (!/^\d{4}-\d{2}-\d{2}$/.test(metaData.lastVerified)) {
  fail("meta.lastVerified must use YYYY-MM-DD");
}

const seenIds = new Set();
for (const event of eventsData.events ?? []) {
  for (const field of requiredEventFields) {
    if (!(field in event) || event[field] === "") {
      fail(`event ${event.id ?? "(missing id)"} is missing ${field}`);
    }
  }
  if (seenIds.has(event.id)) fail(`duplicate event id ${event.id}`);
  seenIds.add(event.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
    fail(`event ${event.id} has an invalid date`);
  }
  if (!Array.isArray(event.sources) || event.sources.length === 0) {
    fail(`event ${event.id} needs at least one source`);
  }
  for (const source of event.sources) {
    if (!/^https:\/\//.test(source.url)) {
      fail(`event ${event.id} has a non-HTTPS source`);
    }
  }
}

for (const constellation of constellationsData.items ?? []) {
  if (!constellation.id || !constellation.name || !constellation.source) {
    fail("every constellation needs id, name, and source");
  }
  if (typeof constellation.current !== "number" || constellation.current < 0) {
    fail(`constellation ${constellation.id} has an invalid current value`);
  }
}

for (const program of programsData.items ?? []) {
  if (!program.id || !program.name || !program.source) {
    fail("every program needs id, name, and source");
  }
  if (program.progress < 0 || program.progress > 100) {
    fail(`program ${program.id} progress must be between 0 and 100`);
  }
}

console.log(
  `Validated ${seenIds.size} events, ${constellationsData.items.length} constellations, and ${programsData.items.length} programs.`,
);
