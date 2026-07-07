#!/usr/bin/env node
/**
 * Build system design sources + questions from docs/sytemdesign/*.md
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");
const docsDir = path.join(rootDir, "docs/sytemdesign");
const outSources = path.join(rootDir, "src/data/sources/systemdesign");
const outQuestions = path.join(rootDir, "src/data/questions/systemdesign");

const TITLE_BY_FILE = {
  "comunication.md": "通信（HTTP / WebSocket / gRPC）",
  "scalability.md": "スケーラビリティ",
  "availability-reliability.md": "可用性・信頼性",
  "bigdata-processing.md": "ビッグデータ処理",
  "design-patterns.md": "設計パターン",
  "performance.md": "パフォーマンス",
  "transaction.md": "トランザクション",
};

/** @param {string} file */
function slugFromFile(file) {
  return file.replace(/\.md$/, "").replace(/^comunication$/, "communication");
}

/** @param {string} text */
function cleanContent(text) {
  return text
   .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (t === "notion image") return false;
      if (/^(Amazon |Google |YouTube |MDN |LINE |Sansan |OpenWork |Databricks |NTTDATA |Yahoo! |gihyo\.jp|Amazon Web Services|LINE ENGINEERING|LINE ENGINEERING|Chrome Dev Tools)/i.test(t)) {
        return false;
      }
      if (/^https?:\/\//.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** @param {string} line */
function isHeaderLine(line) {
  const t = line.trim();
  if (!t || t.length > 100) return false;
  if (/^💡$/.test(t)) return false;
  if (/^💡/.test(t) && t.length > 3) return true;
  if (/^(notion image|GET |POST |def |const |from |import |class |return |if |\/\/|\/\*|#include|@app\.|DB_CONFIG|signal\.|app\.run|time\.sleep|\{|\}|const inputData)/.test(t)) {
    return false;
  }
  if (/^(https?:\/\/|www\.|Amazon |Google |YouTube |MDN |LINE |Sansan |OpenWork |Databricks |NTTDATA |Yahoo! |gihyo\.jp|Chrome Dev Tools|Amazon Web Services|Scaling strategies|より$|引用$)/i.test(t)) {
    return false;
  }
  if (/^[\d.]+\s*$/.test(t)) return false;
  if (/^📗/.test(t)) return false;
  if (/^[A-Z][a-z0-9]*ロードバランサー|^L[47]ロードバランサー|^DNSロードバランサー|^Tumbling Windows|^Sliding Windows|^Session Windows|^Global Windows|^Event Time|^Processing Time|^Watermark|^Map関数|^Shuffle関数|^Reduce関数|^RDD|^OLAP|^OLTP/.test(t)) {
    return true;
  }
  if (/^\d+\.\s+[\u3040-\u9faf\u4e00-\u9fffA-Za-z]/.test(t) && t.length <= 90) return true;
  if (/とは$|について$|の違い$|を活用する$|を送信|を制限する$|を向上$|を処理する$|を実現する$|フェーズ$|Windows$|Time$|^MapReduce|^Apache Spark|^ストリーム処理|^バッチ処理|^カラム指向|^シングルリーダー|^非同期レプリケーション|^同期レプリケーション|^アクティブ/.test(t) && t.length <= 80) {
    return true;
  }
  if (t.length <= 45 && !/[。、]/.test(t) && /[\u4e00-\u9faf\u3040-\u30ff]/.test(t)) return true;
  if (t.length <= 70 && !/[。]/.test(t) && /[\u4e00-\u9faf]{4,}/.test(t) && !/^\{/.test(t) && !/^\//.test(t)) {
    return true;
  }
  return false;
}

/** @param {string} content @param {string} slug */
function parseSections(content, slug) {
  const lines = content.split("\n");
  /** @type {{ title: string, parts: string[] }[]} */
  const sections = [];
  /** @type {{ title: string, parts: string[] } | null} */
  let current = null;

  function flush() {
    if (!current) return;
    const body = current.parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (current.title.length >= 3 && (body.length >= 25 || current.title.length >= 8)) {
      sections.push({ title: current.title, parts: body ? [body] : [] });
    }
    current = null;
  }

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (current?.parts.length) {
        const last = current.parts[current.parts.length - 1];
        if (last !== "") current.parts.push("");
      }
      continue;
    }

    if (t === "💡") {
      if (current) current.parts.push(t);
      continue;
    }

    if (isHeaderLine(t)) {
      flush();
      current = { title: t.replace(/^💡\s*/, ""), parts: [] };
      continue;
    }

    if (!current) {
      current = { title: t.slice(0, 60), parts: [] };
      continue;
    }

    current.parts.push(t);
  }
  flush();

  return sections
    .map((s, i) => {
      const body = s.parts.join("\n").trim();
      const full = body ? `${s.title}\n\n${body}` : s.title;
      return {
        id: `${slug}-${String(i).padStart(3, "0")}`,
        title: s.title,
        content: full,
        order: i,
      };
    })
    .filter((s) => s.content.trim().length >= 40);
}

/** @param {string} text */
function extractKeyPoints(text) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-•・👉\s]*/, "").trim())
    .filter((l) => l.length >= 6 && l.length <= 200 && !/^💡|^notion image|^https?:\/\//.test(l));
  if (lines.length >= 1) return lines.slice(0, 6);
  const sentences = text
    .split(/[。．!！?？]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 120);
  return sentences.slice(0, 5);
}

/** @param {string} title @param {string} body */
function buildAnswer(title, body) {
  const sentences = body
    .split(/[。．!！?？]\n?/)
    .map((s) => s.replace(/\n/g, " ").trim())
    .filter((s) => s.length >= 12 && s.length <= 300 && !/^https?:\/\//.test(s) && !/^(Amazon|Google|YouTube|MDN|LINE |Sansan)/.test(s));
  const picked = sentences.slice(0, 4);
  if (picked.length === 0) {
    return body.replace(/\n+/g, " ").slice(0, 400).trim();
  }
  return picked.map((s) => (s.endsWith("。") ? s : `${s}。`)).join("\n\n");
}

/** @param {string} title */
function buildPrompt(title) {
  const t = title.trim();
  if (/[？?]$/.test(t)) return t;
  if (/^(なぜ|何故|どう|何|いつ|どの)/.test(t)) return `${t.replace(/[。．]$/, "")}？`;
  return `「${t}」について説明してください`;
}

/** @param {string} title @param {string} docTitle */
function inferTags(title, docTitle) {
  const tags = new Set(["システムデザイン", docTitle]);
  const patterns = [
    ["HTTP", /HTTP/i],
    ["WebSocket", /WebSocket/i],
    ["gRPC", /gRPC/i],
    ["ロードバランサー", /ロードバランサー|Load Balancer/i],
    ["レプリケーション", /レプリケーション/i],
    ["キャッシュ", /キャッシュ|Cache/i],
    ["MapReduce", /MapReduce|Hadoop|Spark|Flink/i],
    ["Pub/Sub", /Pub\/Sub|Kafka|メッセージキュー/i],
    ["DB", /データベース|RDB|Spanner|Redis|OLAP|OLTP/i],
    ["CAP", /CAP|一貫性|可用性/i],
  ];
  const combined = `${title} ${docTitle}`;
  for (const [tag, re] of patterns) {
    if (re.test(combined)) tags.add(tag);
  }
  return [...tags].slice(0, 6);
}

async function main() {
  await mkdir(outSources, { recursive: true });
  await mkdir(outQuestions, { recursive: true });

  const files = (await readdir(docsDir)).filter((f) => f.endsWith(".md")).sort();
  /** @type {object[]} */
  const sources = [];
  /** @type {object[]} */
  const questions = [];

  for (const file of files) {
    const raw = await readFile(path.join(docsDir, file), "utf8");
    if (!raw.trim()) {
      console.log(`skip empty: ${file}`);
      continue;
    }

    const slug = slugFromFile(file.replace(/\.md$/, ""));
    const docTitle = TITLE_BY_FILE[file] ?? slug;
    const content = cleanContent(raw);
    const sections = parseSections(content, slug);
    const sourceId = `source-systemdesign-${slug}`;

    sources.push({
      id: sourceId,
      questionSet: "systemdesign",
      title: docTitle,
      slug,
      url: `/systemdesign/${slug}`,
      section: "システムデザイン",
      excerpt: content.slice(0, 300),
      content,
      sections,
    });

    sections.forEach((section, index) => {
      const body = section.content.includes("\n\n")
        ? section.content.slice(section.content.indexOf("\n\n") + 2)
        : "";
      const answer = buildAnswer(section.title, body || section.content);
      if (answer.length < 20) return;

      questions.push({
        id: `systemdesign-${slug}-${String(index).padStart(3, "0")}`,
        questionSet: "systemdesign",
        category: "systemdesign",
        tags: inferTags(section.title, docTitle),
        prompt: buildPrompt(section.title),
        answer,
        keyPoints: extractKeyPoints(body || section.content),
        sourceId,
        sectionId: section.id,
        difficulty: answer.length > 350 ? 3 : answer.length > 150 ? 2 : 1,
      });
    });

    console.log(`${file}: ${sections.length} sections, ${questions.filter((q) => q.sourceId === sourceId).length} questions`);
  }

  await writeFile(path.join(outSources, "index.json"), `${JSON.stringify(sources, null, 2)}\n`, "utf8");
  await writeFile(path.join(outQuestions, "general.json"), `${JSON.stringify(questions, null, 2)}\n`, "utf8");
  console.log(`\nTotal: ${sources.length} sources, ${questions.length} questions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
