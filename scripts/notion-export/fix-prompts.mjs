#!/usr/bin/env node
/**
 * Regenerate question prompts from answers without leaking answer text.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inferSectionFromTags, toPrompt } from "./prompt-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");

const TARGET_FILES = [
  path.join(rootDir, "src/data/questions/notion/interview.json"),
  path.join(rootDir, "src/data/questions/notion/product-deep-dive.json"),
  path.join(rootDir, "scripts/notion-export/output/questions/interview.json"),
  path.join(rootDir, "scripts/notion-export/output/questions/product-deep-dive.json"),
];

/** @param {string} filePath */
async function fixFile(filePath) {
  let questions;
  try {
    questions = JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    console.warn(`Skip (not found): ${filePath}`);
    return { updated: 0, total: 0 };
  }

  let updated = 0;
  for (const q of questions) {
    const section = inferSectionFromTags(q.tags, q.category);
    const nextPrompt = toPrompt(q.answer, section);
    if (q.prompt !== nextPrompt) {
      q.prompt = nextPrompt;
      updated += 1;
    }
  }

  await writeFile(filePath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
  return { updated, total: questions.length };
}

async function main() {
  let totalUpdated = 0;
  let totalQuestions = 0;

  for (const filePath of TARGET_FILES) {
    const { updated, total } = await fixFile(filePath);
    if (total === 0) continue;
    console.log(`${path.relative(rootDir, filePath)}: ${updated}/${total} prompts updated`);
    totalUpdated += updated;
    totalQuestions += total;
  }

  console.log(`\nDone: ${totalUpdated} prompts updated (${totalQuestions} questions)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
