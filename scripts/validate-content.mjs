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
  "detail",
  "sources",
];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, `file://${root}/`), "utf8"));
}

function fail(message) {
  throw new Error(`Content validation failed: ${message}`);
}

const [eventsData, constellationsData, programsData, companiesData, metaData, scheduleData] = await Promise.all([
  readJson("content/events.json"),
  readJson("content/constellations.json"),
  readJson("content/programs.json"),
  readJson("content/companies.json"),
  readJson("content/meta.json"),
  readJson("content/schedule.json"),
]);

if (!/^\d{4}-\d{2}-\d{2}$/.test(metaData.lastVerified)) {
  fail("meta.lastVerified must use YYYY-MM-DD");
}

if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(metaData.spreadsheetUrl ?? "")) {
  fail("meta.spreadsheetUrl must be a Google Sheets HTTPS URL");
}

const companyNames = new Set();
const companyIds = new Set();
for (const company of companiesData.items ?? []) {
  for (const field of ["id", "name", "ticker", "focus", "status", "statusTone", "source"]) {
    if (!company[field]) fail(`company ${company.id ?? "(missing id)"} is missing ${field}`);
  }
  if (companyIds.has(company.id)) fail(`duplicate company id ${company.id}`);
  if (companyNames.has(company.name)) fail(`duplicate company name ${company.name}`);
  if (!/^https:\/\//.test(company.source)) fail(`company ${company.id} has a non-HTTPS source`);
  companyIds.add(company.id);
  companyNames.add(company.name);
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
  if (!companyNames.has(event.company)) {
    fail(`event ${event.id} references unknown company ${event.company}`);
  }
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
  for (const field of ["sourceClass", "lastChecked"]) {
    if (!constellation[field]) fail(`constellation ${constellation.id} is missing ${field}`);
  }
  if (typeof constellation.current !== "number" || constellation.current < 0) {
    fail(`constellation ${constellation.id} has an invalid current value`);
  }
  for (const field of [
    "totalLabel",
    "nextMission",
    "nextLaunchDisplay",
    "nextStatus",
    "nextVehicle",
    "nextSourceLabel",
    "nextSource",
    "scheduleConfidence",
  ]) {
    if (!constellation.deployment?.[field]) {
      fail(`constellation ${constellation.id} deployment is missing ${field}`);
    }
  }
  if (
    constellation.deployment.nextLaunchDate !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(constellation.deployment.nextLaunchDate)
  ) {
    fail(`constellation ${constellation.id} has an invalid next launch date`);
  }
  if (!/^https:\/\//.test(constellation.deployment.nextSource)) {
    fail(`constellation ${constellation.id} has a non-HTTPS next launch source`);
  }
}

for (const program of programsData.items ?? []) {
  if (!program.id || !program.name || !program.source) {
    fail("every program needs id, name, and source");
  }
  if (!Array.isArray(program.stages) || program.stages.length < 2) {
    fail(`program ${program.id} needs at least two public milestone stages`);
  }
  for (const stage of program.stages) {
    if (!stage.label || !["complete", "active", "upcoming"].includes(stage.state)) {
      fail(`program ${program.id} has an invalid milestone stage`);
    }
  }
}

const scheduleIds = new Set();
for (const item of scheduleData.items ?? []) {
  for (const field of ["id", "company", "mission", "window", "bucket", "confidence", "vehicle", "source"]) {
    if (!item[field]) fail(`schedule item ${item.id ?? "(missing id)"} is missing ${field}`);
  }
  if (scheduleIds.has(item.id)) fail(`duplicate schedule id ${item.id}`);
  if (!companyNames.has(item.company)) fail(`schedule item ${item.id} references unknown company ${item.company}`);
  if (!["30d", "90d", "90plus", "tbd"].includes(item.bucket)) fail(`schedule item ${item.id} has an invalid bucket`);
  if (!/^https:\/\//.test(item.source)) fail(`schedule item ${item.id} has a non-HTTPS source`);
  scheduleIds.add(item.id);
}

console.log(
  `Validated ${seenIds.size} events, ${companiesData.items.length} companies, ${constellationsData.items.length} deployment programs, ${programsData.items.length} rocket programs, and ${scheduleIds.size} upcoming missions.`,
);
