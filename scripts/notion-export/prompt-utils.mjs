/** @param {string} text */
export function normalizeEmoji(text) {
  return text.replace(/^👉\s*/, "").trim();
}

/** @param {string} text */
export function isQuestionLike(text) {
  const t = text.trim().split(/\n/)[0];
  if (/[？?]$/.test(t)) return true;
  if (/^(なぜ|どう|何を|何が|何故|いつ|どの|どれ|誰|どこ|どうして|どんな)/.test(t)) {
    return true;
  }
  if (/ますか|ですか|でしょうか|見る$|あるか$|いるか$/.test(t)) return true;
  return false;
}

/** @param {string} text */
export function toQuestionForm(text) {
  const t = text.trim().split(/\n/)[0];
  if (/[？?]$/.test(t)) return t;
  return `${t}？`;
}

/** @param {string} text */
export function extractDefinitionSubject(text) {
  const firstLine = normalizeEmoji(text.split(/\n/)[0]).trim();
  const match = firstLine.match(/^([^=＝]+?)\s*[=＝]\s*/);
  if (!match) return null;
  return match[1]
    .replace(/[（(][^)）]+[)）]\s*$/, "")
    .trim()
    .slice(0, 50);
}

/** @param {string} text */
export function extractNumberedTopic(text) {
  const firstLine = text.split(/\n/)[0].trim();
  const match = firstLine.match(/^\d+(?:\.\d+)*\s+(.+)$/);
  return match ? match[1].trim().slice(0, 60) : null;
}

/** @param {string} text */
export function isStatementLike(text) {
  const line = normalizeEmoji(text.split(/\n/)[0]);
  return (
    /[出入]|する|した|である|です|られる|れる|ない$|できる|される/.test(line) &&
    line.length > 8
  );
}

/** @param {string} text */
export function isTopicLabel(text) {
  const line = normalizeEmoji(text.split(/\n/)[0]).trim();
  if (line.length > 80) return false;
  if (/[。．]$/.test(line)) return false;
  if (/の違い|方法|とは$|（[^）]+）$/.test(line)) return true;
  if (line.length <= 40 && !isStatementLike(line)) return true;
  return false;
}

/** @param {string[]} tags @param {string} category */
export function inferSectionFromTags(tags, category) {
  const skipLabels = new Set([
    "質問集",
    "プロダクト深掘り",
    "interview",
    "product-deep-dive",
    category,
  ]);
  for (const tag of tags ?? []) {
    if (!skipLabels.has(tag)) return tag;
  }
  return "";
}

/**
 * @param {string} answer
 * @param {string} section
 */
export function toPrompt(answer, section) {
  const t = answer.trim();
  if (!t) return "内容を説明してください";

  const firstLine = t.split(/\n/)[0].trim();

  if (isQuestionLike(t)) {
    return toQuestionForm(firstLine);
  }

  const defSubject = extractDefinitionSubject(t);
  if (defSubject) {
    const subject = defSubject.replace(/^[\d.]+\s*/, "");
    if (section && !section.includes(subject)) {
      return `「${section}」における「${subject}」について説明してください`;
    }
    return `「${subject}」について説明してください`;
  }

  if (/^👉\s/.test(firstLine) || isStatementLike(t)) {
    if (section) {
      return `「${section}」の内容について説明してください`;
    }
    return "この項目について説明してください";
  }

  const numberedTopic = extractNumberedTopic(t);
  if (numberedTopic && t.length <= 120) {
    if (section) {
      return `「${section}」の「${numberedTopic}」について説明してください`;
    }
    return `「${numberedTopic}」について説明してください`;
  }

  if (isTopicLabel(t) && firstLine.length <= 80) {
    const topic = normalizeEmoji(firstLine).replace(/^[\d.]+\s*/, "").slice(0, 60);
    if (section && section !== topic && !topic.includes(section)) {
      return `「${section}」の文脈で「${topic}」について説明してください`;
    }
    return `「${topic}」について説明してください`;
  }

  if (section) {
    const subHeading = normalizeEmoji(firstLine);
    if (subHeading.length <= 45 && !/[。．]$/.test(subHeading) && t.includes("\n")) {
      return `「${section}」の「${subHeading}」について説明してください`;
    }
    return `「${section}」について、学習内容の要点を説明してください`;
  }

  return "この資料の内容について要点を説明してください";
}
