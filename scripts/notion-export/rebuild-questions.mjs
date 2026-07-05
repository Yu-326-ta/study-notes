#!/usr/bin/env node
/**
 * Rebuild question JSON from source excerpts with proper Q&A pairing.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrompt,
  extractKeyPoints,
  inferTags,
  parseExcerptIntoCards,
} from "./card-grouper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");

const CATEGORIES = [
  { category: "interview", title: "質問集" },
  { category: "product-deep-dive", title: "プロダクト深掘り" },
];

/** @param {string} pageIdCompact */
function makeQuestionId(category, pageIdCompact, index) {
  return `notion-${category}-${pageIdCompact}-${String(index).padStart(3, "0")}`;
}

/** @param {object} source */
function sourcePageIdCompact(source) {
  const match = source.id.match(/source-\w+-(.+)$/);
  return match ? match[1] : source.id;
}

/** @param {string} prompt */
function normalizePromptKey(prompt) {
  return prompt.replace(/[？?]$/, "").trim();
}

/** @param {string} dir @param {string} category @param {string} sourcesSubdir @param {Set<string>} [skipPromptKeys] */
async function rebuildCategory(dir, category, sourcesSubdir, skipPromptKeys = new Set()) {
  const sourcesPath = path.join(dir, sourcesSubdir, `${category}.json`);
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));

  /** @type {object[]} */
  const questions = [];

  for (const source of sources) {
    if (!source.excerpt?.trim()) continue;
    const pageId = sourcePageIdCompact(source);
    const cards = parseExcerptIntoCards(source.excerpt);
    let index = 0;

    for (const card of cards) {
      if (card.answer.trim().length < 8) continue;
      const prompt = buildPrompt(card.topic, card.section);
      if (skipPromptKeys.has(normalizePromptKey(prompt))) continue;
      questions.push({
        id: makeQuestionId(category, pageId, index++),
        questionSet: "notion",
        category,
        tags: inferTags(source.title, card.section, category, card.topic),
        prompt,
        answer: card.answer,
        keyPoints: extractKeyPoints(card.answer),
        sourceId: source.id,
        difficulty:
          card.answer.length > 400 ? 3 : card.answer.length > 150 ? 2 : 1,
      });
    }
  }

  questions.sort((a, b) => a.id.localeCompare(b.id));
  return questions;
}

async function main() {
  const targets = [
    { baseDir: path.join(rootDir, "src/data"), sourcesSubdir: "sources/notion" },
    {
      baseDir: path.join(rootDir, "scripts/notion-export/output"),
      sourcesSubdir: "sources",
    },
  ];

  for (const { baseDir, sourcesSubdir } of targets) {
    for (const { category } of CATEGORIES) {
      const sourcesPath = path.join(baseDir, sourcesSubdir, `${category}.json`);
      try {
        await readFile(sourcesPath, "utf8");
      } catch {
        continue;
      }

      /** @type {Set<string>} */
      let skipPromptKeys = new Set();
      if (category === "product-deep-dive" && baseDir.includes("src/data")) {
        const interviewQuestions = await rebuildCategory(
          baseDir,
          "interview",
          sourcesSubdir,
        );
        skipPromptKeys = new Set(
          interviewQuestions.map((q) => normalizePromptKey(q.prompt)),
        );
      }

      const questions = await rebuildCategory(
        baseDir,
        category,
        sourcesSubdir,
        skipPromptKeys,
      );
      const outDir =
        baseDir.includes("output")
          ? path.join(baseDir, "questions")
          : path.join(baseDir, "questions", "notion");
      await mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `${category}.json`);
      await writeFile(outPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
      console.log(
        `${path.relative(rootDir, outPath)}: ${questions.length} questions`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
