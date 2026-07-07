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

  const settings = loadSettings();
  const questionSet: QuestionSet | "mixed" =
    setParam === "mixed"
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

    if (questionSet === "mixed" && settings.mixedMode) {
      const notionQ = getAllQuestions("notion");
      const relatedQ = getAllQuestions("related");
      const notionProgress = loadProgress("notion");
      const relatedProgress = loadProgress("related");
      const half = Math.ceil(settings.sessionSize / 2);
      const fromNotion = selectQuestions(notionQ, notionProgress, mode, {
        limit: half,
        interleave: settings.interleave,
        category: category ?? undefined,
      });
      const fromRelated = selectQuestions(relatedQ, relatedProgress, mode, {
        limit: settings.sessionSize - fromNotion.length,
        interleave: settings.interleave,
      });
      return [...fromNotion, ...fromRelated];
    }

    const set: QuestionSet = questionSet === "mixed" ? "notion" : questionSet;
    const all = getAllQuestions(set);
    const progress = loadProgress(set);
    const weakTags =
      tagsParam?.split(",").filter(Boolean) ??
      getWeakTagsFromNotionProgress(loadProgress("notion"), 5);

    return selectQuestions(all, progress, mode, {
      category: category ?? undefined,
      sourceId: sourceId ?? undefined,
      weakTags: mode === "tag-linked" ? weakTags : undefined,
      limit: settings.sessionSize,
      interleave: settings.interleave,
    });
  }, [
    mounted,
    customizationRevision,
    singleId,
    questionSet,
    mode,
    category,
    sourceId,
    tagsParam,
    settings.mixedMode,
    settings.sessionSize,
    settings.interleave,
  ]);

  if (!mounted) {
    return <div className="py-20 text-center">読み込み中...</div>;
  }

  return (
    <StudySessionClient questions={questions} questionSet={questionSet} />
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">読み込み中...</div>}>
      <StudyPageInner />
    </Suspense>
  );
}
