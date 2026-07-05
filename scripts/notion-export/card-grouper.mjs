/** @param {string} line */
export function normalizeTopicLine(line) {
  return line.replace(/^#{1,3}\s*/, "").replace(/^👉\s*/, "").trim();
}

/** @param {string} line */
export function isExplicitQuestion(line) {
  const t = normalizeTopicLine(line);
  if (/^(なぜ|何故|どう|何を|何が|何|いつ|どの|どれ|誰|どこ|どうして)/.test(t)) {
    return true;
  }
  if (/教えて|説明して|話して/.test(t) && t.length <= 120) return true;
  if (/[？?]$/.test(t) && t.length <= 80 && !/、/.test(t)) return true;
  return false;
}

/** @param {string} line */
export function isChecklistItem(line) {
  const t = normalizeTopicLine(line);
  if (t.length > 45) return false;
  if (/[？?]/.test(t)) return false;
  if (/^(なぜ|何故|どう|何|いつ|どの|どれ|誰|どこ)/.test(t)) return false;
  if (/どんな|見る$|方法$|について$|経験$|違い$|教えて|説明して|話して|特性|選定|構成|アピール/.test(t)) {
    return false;
  }
  if (/^👉/.test(line.trim())) return false;
  if (/^#{1,3}\s/.test(line.trim())) return false;
  if (/か$/.test(t) && t.length <= 35) return true;
  return false;
}

/** @param {string} line */
export function isTopicLine(line) {
  const t = normalizeTopicLine(line);
  if (!t) return false;
  if (/^#{1,3}\s/.test(line.trim())) {
    if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) return true;
    if (/^\d+(?:\.\d+)+\s/.test(t)) return true;
    if (/^\d+\.\s/.test(t)) return true;
    return false;
  }
  if (isExplicitQuestion(t)) return true;
  if (isChecklistItem(line)) return false;
  if (/方法$|について$|経験$|違い$|選定|特性とは|見る$/.test(t) && t.length <= 100) {
    return true;
  }
  if (/アピール/.test(t) && t.length <= 60 && !/。/.test(t)) {
    return true;
  }
  if (/どんな/.test(t) && t.length <= 60) return true;
  if (/^\d+(?:\.\d+)*\s+\S/.test(t) && t.length <= 80) return true;
  return false;
}

/** @param {string} line */
export function isNumberedSectionHeader(line) {
  const t = normalizeTopicLine(line);
  if (/^Q:\s/.test(line.trim())) return false;
  if (/^#{1,3}\s/.test(line.trim())) return false;
  if (/^\d+(?:\.\d+)+\s+\S/.test(t) && !/[？?]$/.test(t)) return true;
  return false;
}

/** @param {string} line */
export function isDefinitionSectionHeader(line) {
  const t = normalizeTopicLine(line);
  if (!/^#{1,3}\s/.test(line.trim())) return false;
  if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) return false;
  if (/^\d+(?:\.\d+)+\s/.test(t)) return true;
  if (/とは$/.test(t)) return true;
  if (/^比較:/.test(t)) return true;
  if (/^「/.test(t) && /[？」?]$/.test(t)) return true;
  if (/代償|コスト/.test(t)) return true;
  return false;
}

/** @param {string} line */
export function isSectionContextHeader(line) {
  const t = normalizeTopicLine(line);
  if (!/^#{1,3}\s/.test(line.trim())) return false;
  if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) return false;
  if (/^\d+(?:\.\d+)+\s/.test(t)) return false;
  if (isDefinitionSectionHeader(line)) return false;
  if (/^(ACIDの内訳|[A-Z]：)/i.test(t)) return true;
  if (t.length <= 14 && !/\d/.test(t)) return true;
  return false;
}

/**
 * @param {string} excerpt
 * @returns {{ topic: string, section: string, answer: string }[]}
 */
export function parseExcerptIntoCards(excerpt) {
  const blocks = excerpt
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  /** @type {{ topic: string, section: string, answer: string }[]} */
  const cards = [];
  let section = "";
  /** @type {{ topic: string, section: string, answerLines: string[] } | null} */
  let current = null;

  function flush() {
    if (!current || current.answerLines.length === 0) {
      current = null;
      return;
    }
    cards.push({
      topic: current.topic,
      section: current.section,
      answer: current.answerLines.join("\n\n"),
    });
    current = null;
  }

  for (const line of blocks) {
    if (isNumberedSectionHeader(line)) {
      section = normalizeTopicLine(line);
      continue;
    }

    if (isSectionContextHeader(line)) {
      section = normalizeTopicLine(line);
      continue;
    }

    if (isDefinitionSectionHeader(line)) {
      flush();
      current = {
        topic: normalizeTopicLine(line),
        section,
        answerLines: [],
      };
      continue;
    }

    if (/^Q:\s/.test(line.trim())) {
      flush();
      current = {
        topic: line.trim().replace(/^Q:\s*/, ""),
        section,
        answerLines: [],
      };
      continue;
    }

    if (isTopicLine(line)) {
      flush();
      current = {
        topic: normalizeTopicLine(line),
        section,
        answerLines: [],
      };
      continue;
    }

    if (current) {
      current.answerLines.push(line.replace(/^#{1,3}\s*/, "").trim());
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      section = normalizeTopicLine(line);
    }
  }

  flush();
  return cards;
}

/**
 * @param {string} topic
 * @param {string} section
 */
export function buildPrompt(topic, section) {
  const t = topic.trim();
  if (!t) return "内容を説明してください";

  const quotedMatch = t.match(/^「(.+)」$/);
  if (quotedMatch) {
    const inner = quotedMatch[1].trim();
    if (isExplicitQuestion(inner) || /[？?]$/.test(inner)) {
      return /[？?]$/.test(inner) ? inner : `${inner}？`;
    }
  }

  if (isExplicitQuestion(t)) {
    if (/[？?]$/.test(t)) return t;
    return `${t.replace(/[。．]$/, "")}？`;
  }

  const defMatch = t.match(/^([^=＝]+?)\s*[=＝]\s*(.+)$/);
  if (defMatch) {
    const subject = defMatch[1].trim();
    return `「${subject}」について説明してください`;
  }

  if (section && section !== t && !t.includes(section)) {
    return `「${t}」について説明してください`;
  }

  return `「${t}」について説明してください`;
}

/**
 * @param {string} title
 * @param {string} section
 * @param {string} category
 * @param {string} [topic]
 */
export function inferTags(title, section, category, topic = "") {
  /** @type {string[]} */
  const tags = [];
  const combined = `${title} ${section} ${topic} ${category}`;
  const patterns = [
    ["Go", /\bGo\b|ゴー言語/i],
    ["Spanner", /Spanner/i],
    ["GraphQL", /GraphQL/i],
    ["gRPC", /gRPC/i],
    ["Pub/Sub", /Pub\/Sub/i],
    ["GCP", /GCP|Google Cloud/i],
    ["PR", /PRレビュー|プルリク/i],
    ["GC", /\bGC\b|ガベージ/i],
    ["ACID", /ACID/i],
    ["SOLID", /SOLID/i],
  ];
  for (const [tag, re] of patterns) {
    if (re.test(combined)) tags.push(tag);
  }
  if (section && section.length <= 40 && !tags.includes(section)) {
    if (!/^(実務的な使い分け|ACIDの内訳)$/.test(section)) {
      tags.push(section);
    }
  }
  if (title && title.length <= 40 && !tags.includes(title)) {
    tags.push(title);
  }
  if (/SOLID/i.test(`${title} ${section} ${combined}`) && !tags.includes("SOLID")) {
    tags.unshift("SOLID");
  }
  const categoryLabel = category === "interview" ? "質問集" : "プロダクト深掘り";
  if (!tags.includes(categoryLabel)) tags.push(categoryLabel);
  return tags.slice(0, 6);
}

/** @param {string} text */
export function extractKeyPoints(text) {
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[-•・👉\s]*/, "").trim())
    .filter((l) => l.length >= 4 && l.length <= 200 && !/^例$|^↑/.test(l));
  if (lines.length >= 1) return lines.slice(0, 8);
  const sentences = text
    .split(/[。．!！?？]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && s.length <= 120);
  if (sentences.length >= 1) return sentences.slice(0, 5);
  return undefined;
}
