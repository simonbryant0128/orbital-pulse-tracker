import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile breakpoints keep the tracker readable and event details accessible", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /\.site-header nav\s*\{\s*display:\s*none;/);
  assert.match(css, /\.deployment-grid\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.match(css, /\.schedule-board\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.match(css, /\.event-hover-preview\s*\{\s*display:\s*none;/);
  assert.match(css, /\.event-modal\s*\{\s*max-height:\s*calc\(100vh - 2rem\);/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /\.primary-action\s*\{\s*width:\s*100%;/);
});
