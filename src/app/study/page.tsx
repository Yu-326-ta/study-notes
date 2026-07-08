"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { NotionCategory, QuestionSet, StudyMode } from "@/domain/question";
import {
  getAllQuestions,
  getQuestionById,
  getWeakTagsFromNotionProgress,
  selectQuestions,
  selectRetryQuestions,
} from "@/lib/data";
import { loadProgress, loadSettings } from "@/lib/storage";
import { useIsClient } from "@/hooks/useIsClient";
import { useQuestionCustomizationRevision } from "@/hooks/useQuestionCustomizationRevision";
import { StudySessionClient } from "@/components/study/StudySessionClient";

function StudyPageInner() {
  const mounted = useIsClient();
  const customizationRevision = useQuestionCustomizationRevision();
  const searchParams = useSearchParams();

  const setParam = searchParams.get("set") ?? "notion";
  const mode = (searchParams.get("mode") ?? "due-today") as StudyMode;
  const category = searchParams.get("category") as NotionCategory | null;
  const sourceId = searchParams.get("sourceId");
  const singleId = searchParams.get("single");
  const tagsParam = searchParams.get("tags");
  const idsParam = searchParams.get("ids");
  const continuous = searchParams.get("continuous") === "1";
  const isRetryMode =
    mode === "retry-missed" ||
    mode === "retry-partial" ||
    mode === "retry-unknown";

  const settings = loadSettings();
  const questionSet: QuestionSet | "mixed" | "all" =
    setParam === "all"
      ? "all"
      : setParam === "mixed"
        ? "mixed"
        : setParam === "related"
          ? "related"
          : setParam === "systemdesign"
            ? "systemdesign"
            : "notion";

  const questions = useMemo(() => {
    if (!mounted) return [];

    if (singleId) {
      const q = getQuestionById(singleId);
      return q ? [q] : [];
    }

    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      return selectQuestions(getAllQuestions(), loadProgress("notion"), "all", {
        questionIds: ids,
        interleave: true,
      });
    }

    if (isRetryMode && setParam === "all") {
      return selectRetryQuestions(
        ["notion", "related", "systemdesign"],
        mode,
        {
          limit: continuous ? undefined : settings.sessionSize,
          interleave: true,
        }
      );
    }

    if (questionSet === "mixed" && settings.mixedMode) {
      const notionQ = getAllQuestions("notion");
      const relatedQ = getAllQuestions("related");
      const notionProgress = loadProgress("notion");
      const relatedProgress = loadProgress("related");
      const sessionLimit = continuous ? undefined : settings.sessionSize;
      const half = continuous
        ? Math.ceil((notionQ.length + relatedQ.length) / 2)
        : Math.ceil(settings.sessionSize / 2);
      const fromNotion = selectQuestions(notionQ, notionProgress, mode, {
        limit: continuous ? notionQ.length : half,
        interleave: true,
        category: category ?? undefined,
      });
      const fromRelated = selectQuestions(relatedQ, relatedProgress, mode, {
        limit: continuous ? relatedQ.length : sessionLimit,
        interleave: true,
      });
      return [...fromNotion, ...fromRelated];
    }

    const set: QuestionSet =
      questionSet === "mixed" || questionSet === "all" ? "notion" : questionSet;
    const all = getAllQuestions(set);
    const progress = loadProgress(set);
    const filterTags = tagsParam?.split(",").filter(Boolean);
    const weakTags =
      filterTags ??
      getWeakTagsFromNotionProgress(loadProgress("notion"), 5);
    const sessionLimit = continuous ? undefined : settings.sessionSize;

    return selectQuestions(all, progress, mode, {
      category: category ?? undefined,
      sourceId: sourceId ?? undefined,
      weakTags: mode === "tag-linked" ? weakTags : undefined,
      tags: mode === "tag" ? filterTags : undefined,
      limit: sessionLimit,
      interleave: continuous ? true : settings.interleave,
    });
  }, [
    mounted,
    customizationRevision,
    singleId,
    idsParam,
    questionSet,
    mode,
    category,
    sourceId,
    tagsParam,
    continuous,
    settings.mixedMode,
    settings.sessionSize,
    settings.interleave,
  ]);

  if (!mounted) {
    return <div className="py-20 text-center">読み込み中...</div>;
  }

  const effectiveQuestionSet =
    idsParam && questions.length > 0
      ? new Set(questions.map((q) => q.questionSet)).size > 1
        ? ("mixed" as const)
        : questions[0].questionSet
      : questionSet === "all"
        ? questions.length > 0 &&
          new Set(questions.map((q) => q.questionSet)).size > 1
          ? ("mixed" as const)
          : (questions[0]?.questionSet ?? "notion")
        : questionSet === "mixed"
          ? "mixed"
          : questionSet;

  return (
    <StudySessionClient
      questions={questions}
      questionSet={effectiveQuestionSet}
    />
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">読み込み中...</div>}>
      <StudyPageInner />
    </Suspense>
  );
}
