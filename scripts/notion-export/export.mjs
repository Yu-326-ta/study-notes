#!/usr/bin/env node
/**
 * Export Notion public site content via /api/v3/loadPageChunk
 * Groups blocks into Q&A cards (topic + following content).
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPrompt,
  extractKeyPoints,
  inferTags,
  parseExcerptIntoCards,
} from "./card-grouper.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOTION_BASE = "https://yielding-driver-de6.notion.site";
const API_URL = `${NOTION_BASE}/api/v3/loadPageChunk`;

const ROOT_PAGE_ID = "34dc019f-a925-806c-b6ca-cc55db10e541";

/** @type {Record<string, { category: string, title: string }>} */
const TOP_LEVEL_PAGES = {
  "34dc019f-a925-80ce-9e8b-d9f69e67bbd1": {
    category: "interview",
    title: "質問集",
  },
  "34fc019f-a925-806d-a99f-cddbf9fa7d5b": {
    category: "product-deep-dive",
    title: "プロダクト深掘り",
  },
};

const TEXT_BLOCK_TYPES = new Set([
  "text",
  "bulleted_list",
  "numbered_list",
  "quote",
  "callout",
]);

const HEADER_BLOCK_TYPES = new Set([
  "header",
  "sub_header",
  "sub_sub_header",
  "toggle",
]);

const MIN_ANSWER_LENGTH = 8;
const REQUEST_DELAY_MS = 250;

const outputDir = path.join(__dirname, "output");
const sourcesDir = path.join(outputDir, "sources");
const questionsDir = path.join(outputDir, "questions");

/** @type {Map<string, object>} */
const globalBlockCache = new Map();

/** @type {Record<string, object[]>} */
const sourcesByCategory = Object.fromEntries(
  Object.values(TOP_LEVEL_PAGES).map((p) => [p.category, []]),
);

/** @type {Record<string, object[]>} */
const questionsByCategory = Object.fromEntries(
  Object.values(TOP_LEVEL_PAGES).map((p) => [p.category, []]),
);

/** @type {Set<string>} */
const visitedPages = new Set();

/** @type {Set<string>} */
const registeredSourceIds = new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {unknown} richText
 * @returns {string}
 */
function richTextToPlain(richText) {
  if (!Array.isArray(richText)) return "";
  let out = "";
  for (const segment of richText) {
    if (!Array.isArray(segment) || segment.length === 0) continue;
    const first = segment[0];
    if (typeof first === "string") {
      out += first;
      continue;
    }
    if (Array.isArray(first) && typeof first[0] === "string") {
      out += first[0];
    }
  }
  return out.replace(/\u00a0/g, " ").trim();
}

/**
 * @param {Record<string, unknown>} blockMap
 * @param {string} id
 */
function getBlock(blockMap, id) {
  if (globalBlockCache.has(id)) {
    return globalBlockCache.get(id);
  }
  const entry = blockMap[id];
  if (!entry || typeof entry !== "object") return null;
  const wrapped = /** @type {{ value?: unknown }} */ (entry).value;
  if (!wrapped || typeof wrapped !== "object") return null;
  const inner = /** @type {{ value?: unknown; id?: string }} */ (wrapped);
  const block =
    inner.value && typeof inner.value === "object" && "id" in inner.value
      ? inner.value
      : inner;
  if (block && typeof block === "object" && "id" in block) {
    globalBlockCache.set(id, block);
    return block;
  }
  return null;
}

/**
 * @param {string} pageId
 * @returns {Promise<Record<string, unknown>>}
 */
async function loadAllBlocksForPage(pageId) {
  /** @type {Record<string, unknown>} */
  const merged = {};
  let cursor = { stack: [] };
  let chunkNumber = 0;

  for (;;) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor,
        chunkNumber,
        verticalColumns: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `loadPageChunk failed for ${pageId} (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    const data = await res.json();
    if (data.isNotionError) {
      throw new Error(
        `Notion error for ${pageId}: ${data.message ?? data.debugMessage}`,
      );
    }

    const chunkBlocks = data.recordMap?.block ?? {};
    Object.assign(merged, chunkBlocks);

    cursor = data.cursor ?? { stack: [] };
    chunkNumber += 1;

    if (!Array.isArray(cursor.stack) || cursor.stack.length === 0) {
      break;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const [id] of Object.entries(merged)) {
    const block = getBlock(merged, id);
    if (block) globalBlockCache.set(id, block);
  }

  return merged;
}

function notionPageUrl(pageId) {
  return `${NOTION_BASE}/${pageId.replace(/-/g, "")}`;
}

function pageIdCompact(pageId) {
  return pageId.replace(/-/g, "");
}

function makeSourceId(category, pageId) {
  return `source-${category}-${pageIdCompact(pageId)}`;
}

/**
 * @param {object} block
 */
function blockPlainText(block) {
  const props = block.properties;
  if (!props || typeof props !== "object") return "";
  const title = /** @type {{ title?: unknown }} */ (props).title;
  return richTextToPlain(title);
}

/**
 * @param {string} category
 * @param {string} pageId
 * @param {string} pageTitle
 * @param {string} section
 * @param {string} excerpt
 */
function registerSource(category, pageId, pageTitle, section, excerpt) {
  const id = makeSourceId(category, pageId);
  if (registeredSourceIds.has(id)) {
    const existing = sourcesByCategory[category].find((s) => s.id === id);
    if (existing && excerpt.length > (existing.excerpt?.length ?? 0)) {
      existing.excerpt = excerpt.slice(0, 50000);
    }
    return id;
  }
  registeredSourceIds.add(id);
  sourcesByCategory[category].push({
    id,
    questionSet: "notion",
    notionCategory: category,
    title: pageTitle || section || category,
    section: section || undefined,
    url: notionPageUrl(pageId),
    excerpt: excerpt.slice(0, 50000),
  });
  return id;
}

/**
 * @param {string[]} blockIds
 * @param {Record<string, unknown>} blockMap
 * @param {string[]} excerptParts
 * @returns {string[]}
 */
function collectExcerptLines(blockIds, blockMap, excerptParts) {
  /** @type {string[]} */
  const lines = [];

  function walk(ids) {
    for (const blockId of ids) {
      const block = getBlock(blockMap, blockId);
      if (!block || block.alive === false) continue;

      const type = block.type;
      if (type === "page") continue;

      if (HEADER_BLOCK_TYPES.has(type)) {
        const headerText = blockPlainText(block);
        if (headerText) {
          excerptParts.push(`## ${headerText}`);
          lines.push(`## ${headerText}`);
        }
        const children = Array.isArray(block.content) ? block.content : [];
        if (children.length > 0) walk(children);
        continue;
      }

      if (TEXT_BLOCK_TYPES.has(type)) {
        const text = blockPlainText(block);
        if (text) {
          excerptParts.push(text);
          lines.push(text);
        }
      }

      const children = Array.isArray(block.content) ? block.content : [];
      if (children.length > 0 && type !== "toggle") {
        walk(children);
      }
    }
  }

  walk(blockIds);
  return lines;
}

/**
 * @param {string} category
 * @param {string} sourceId
 * @param {string} pageId
 * @param {number} index
 * @param {string} topic
 * @param {string} section
 * @param {string} answer
 * @param {string} pageTitle
 */
function addQuestionCard(
  category,
  sourceId,
  pageId,
  index,
  topic,
  section,
  answer,
  pageTitle,
) {
  if (answer.length < MIN_ANSWER_LENGTH) return;
  const prompt = buildPrompt(topic, section);
  questionsByCategory[category].push({
    id: `notion-${category}-${pageIdCompact(pageId)}-${String(index).padStart(3, "0")}`,
    questionSet: "notion",
    category,
    tags: inferTags(pageTitle, section || topic, category),
    prompt,
    answer,
    keyPoints: extractKeyPoints(answer),
    sourceId,
    difficulty: answer.length > 400 ? 3 : answer.length > 150 ? 2 : 1,
  });
}

/**
 * @param {string} pageId
 * @param {string} category
 * @param {string} pageTitle
 * @param {string} parentSection
 * @param {Record<string, unknown>} blockMap
 */
function processPageContent(
  pageId,
  category,
  pageTitle,
  parentSection,
  blockMap,
) {
  const pageBlock = getBlock(blockMap, pageId);
  if (!pageBlock) return;

  /** @type {string[]} */
  const excerptParts = [];
  const contentIds = Array.isArray(pageBlock.content) ? pageBlock.content : [];
  collectExcerptLines(contentIds, blockMap, excerptParts);

  const excerpt = excerptParts.join("\n\n");
  const sourceId = registerSource(
    category,
    pageId,
    pageTitle,
    parentSection,
    excerpt,
  );

  const cards = parseExcerptIntoCards(excerpt);
  let questionIndex = 0;
  for (const card of cards) {
    addQuestionCard(
      category,
      sourceId,
      pageId,
      questionIndex++,
      card.topic,
      card.section,
      card.answer,
      pageTitle,
    );
  }
}

async function recursePage(pageId, category, parentSection) {
  if (visitedPages.has(pageId)) return;
  visitedPages.add(pageId);

  const blockMap = await loadAllBlocksForPage(pageId);
  await sleep(REQUEST_DELAY_MS);

  const pageBlock = getBlock(blockMap, pageId);
  if (!pageBlock) {
    console.warn(`Warning: page block missing: ${pageId}`);
    return;
  }

  const pageTitle = blockPlainText(pageBlock) || parentSection || pageId;
  const section = parentSection || pageTitle;

  processPageContent(pageId, category, pageTitle, section, blockMap);

  const contentIds = Array.isArray(pageBlock.content) ? pageBlock.content : [];
  for (const blockId of contentIds) {
    const block = getBlock(blockMap, blockId);
    if (!block || block.type !== "page" || block.alive === false) continue;
    const childTitle = blockPlainText(block) || section;
    await recursePage(blockId, category, childTitle);
  }
}

async function writeOutputs() {
  await mkdir(sourcesDir, { recursive: true });
  await mkdir(questionsDir, { recursive: true });

  for (const { category } of Object.values(TOP_LEVEL_PAGES)) {
    const sources = sourcesByCategory[category] ?? [];
    const questions = questionsByCategory[category] ?? [];

    sources.sort((a, b) => a.id.localeCompare(b.id));
    questions.sort((a, b) => a.id.localeCompare(b.id));

    const sourcesPath = path.join(sourcesDir, `${category}.json`);
    const questionsPath = path.join(questionsDir, `${category}.json`);

    await writeFile(sourcesPath, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
    await writeFile(
      questionsPath,
      `${JSON.stringify(questions, null, 2)}\n`,
      "utf8",
    );
  }

  const summaryPath = path.join(outputDir, "summary.json");
  /** @type {Record<string, unknown>} */
  const summary = {};
  for (const { category, title } of Object.values(TOP_LEVEL_PAGES)) {
    summary[category] = {
      label: title,
      sources: sourcesByCategory[category]?.length ?? 0,
      questions: questionsByCategory[category]?.length ?? 0,
    };
  }
  summary._totals = {
    sources: Object.values(sourcesByCategory).reduce((n, a) => n + a.length, 0),
    questions: Object.values(questionsByCategory).reduce(
      (n, a) => n + a.length,
      0,
    ),
    pagesVisited: visitedPages.size,
  };
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  return summary;
}

async function main() {
  console.log("Notion export starting…");
  console.log(`Root: ${ROOT_PAGE_ID}`);

  for (const [pageId, meta] of Object.entries(TOP_LEVEL_PAGES)) {
    console.log(`Fetching category ${meta.category} (${meta.title})…`);
    await recursePage(pageId, meta.category, meta.title);
  }

  const summary = await writeOutputs();

  console.log("\n=== Export complete ===");
  for (const meta of Object.values(TOP_LEVEL_PAGES)) {
    const s = summary[meta.category];
    console.log(
      `${meta.title} (${meta.category}): ${s.sources} sources, ${s.questions} questions`,
    );
  }
  console.log(
    `Total: ${summary._totals.sources} sources, ${summary._totals.questions} questions, ${summary._totals.pagesVisited} pages`,
  );
  console.log(`Output: ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
