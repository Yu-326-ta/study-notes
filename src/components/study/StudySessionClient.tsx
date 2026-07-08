"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Question } from "@/domain/question";
import {
  NOTION_CATEGORY_LABELS,
  QUESTION_SET_LABELS,
  questionSetBadgeVariant,
} from "@/domain/question";
import type { SelfGrade } from "@/domain/progress";
import type { SourceDocument } from "@/domain/source";
import { buildStudyHref, getSourceForQuestion, getQuestionById } from "@/lib/data";
import { recordAnswer } from "@/lib/storage";
import { QuestionActions } from "@/components/questions/QuestionActions";
import { isQuestionEdited } from "@/lib/question-customizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SelfGradeButtons } from "./SelfGradeButtons";
import { SourceSheet } from "./SourcePanel";
import { cn } from "@/lib/cn";

type Phase = "question" | "answer" | "complete";

type SessionStats = { known: number; partial: number; unknown: number };

type StudySessionClientProps = {
  questions: Question[];
  questionSet: "notion" | "related" | "systemdesign" | "mixed";
};

export function StudySessionClient({
  questions: initialQuestions,
  questionSet,
}: StudySessionClientProps) {
  const router = useRouter();
  const [sessionQuestions, setSessionQuestions] = useState(initialQuestions);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [memo, setMemo] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [stats, setStats] = useState<SessionStats>({
    known: 0,
    partial: 0,
    unknown: 0,
  });
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [fillChecked, setFillChecked] = useState(false);
  const [sessionGrades, setSessionGrades] = useState<Record<string, SelfGrade>>({});

  useEffect(() => {
    setSessionQuestions(initialQuestions);
    setIndex(0);
    setPhase("question");
    setSessionGrades({});
  }, [initialQuestions]);

  const questions = sessionQuestions;
  const current = questions[index];
  const source: SourceDocument | undefined = current
    ? getSourceForQuestion(current)
    : undefined;

  const progressSet = useMemo(() => {
    if (questionSet === "mixed") return current?.questionSet ?? "notion";
    return questionSet;
  }, [questionSet, current?.questionSet]);

  const handleGrade = useCallback(
    (grade: SelfGrade) => {
      if (!current) return;
      recordAnswer(progressSet, current.id, grade, memo || undefined);
      setSessionGrades((prev) => ({ ...prev, [current.id]: grade }));
      setStats((s) => ({ ...s, [grade]: s[grade] + 1 }));
      setMemo("");
      setMcSelected(null);
      setFillAnswer("");
      setFillChecked(false);

      if (index + 1 >= questions.length) {
        setPhase("complete");
      } else {
        setIndex((i) => i + 1);
        setPhase("question");
      }
    },
    [current, index, memo, progressSet, questions.length]
  );

  const handleQuestionHidden = useCallback(() => {
    if (!current) return;
    const newList = sessionQuestions.filter((q) => q.id !== current.id);
    setSessionQuestions(newList);
    setMemo("");
    setMcSelected(null);
    setFillAnswer("");
    setFillChecked(false);
    setPhase("question");

    if (newList.length === 0) {
      setPhase("complete");
      return;
    }
    if (index >= newList.length) {
      setIndex(newList.length - 1);
    }
  }, [current, index, sessionQuestions]);

  const handleQuestionEdited = useCallback(() => {
    if (!current) return;
    const updated = getQuestionById(current.id);
    if (!updated) return;
    setSessionQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "question" && e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setPhase("answer");
      }
      if (phase === "answer") {
        if (e.key === "1") handleGrade("known");
        if (e.key === "2") handleGrade("partial");
        if (e.key === "3") handleGrade("unknown");
      }
      if (e.key === "s" || e.key === "S") setSourceOpen((o) => !o);
      if (e.key === "Escape") {
        if (sourceOpen) setSourceOpen(false);
        else if (phase === "answer") setPhase("question");
        else if (confirm("セッションを終了しますか？")) router.push("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleGrade, router, sourceOpen]);

  if (!current && phase !== "complete") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg">出題する問題がありません</p>
        <Button onClick={() => router.push("/")}>ホームに戻る</Button>
      </div>
    );
  }

  if (phase === "complete") {
    const sessionMissedIds = Object.entries(sessionGrades)
      .filter(([, grade]) => grade === "partial" || grade === "unknown")
      .map(([id]) => id);

    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <span className="text-5xl">🎉</span>
        <h1 className="text-2xl font-bold">セッション完了</h1>
        <p className="text-[var(--muted)]">{questions.length} 問学習しました</p>
        <div className="flex gap-6 text-lg">
          <span>😊 {stats.known}</span>
          <span>🤔 {stats.partial}</span>
          <span>😵 {stats.unknown}</span>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {sessionMissedIds.length > 0 && (
            <Button
              onClick={() =>
                router.push(
                  buildStudyHref({
                    ids: sessionMissedIds,
                    continuous: true,
                  })
                )
              }
            >
              このセッションの苦手を再挑戦（{sessionMissedIds.length} 問）
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() =>
              router.push(
                questionSet === "mixed" ? "/retry" : `/retry?set=${questionSet}`
              )
            }
          >
            苦手問題を選んで再挑戦
          </Button>
          <Button variant="ghost" onClick={() => router.push("/")}>
            ホームに戻る
          </Button>
          <Button variant="ghost" onClick={() => router.refresh()}>
            同じ条件でもう一度
          </Button>
        </div>
      </div>
    );
  }

  const format = current.format ?? "recall";

  return (
    <div className={cn("relative", sourceOpen && "lg:mr-96")}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (confirm("セッションを終了しますか？")) router.push("/");
          }}
          className="min-h-[44px] px-2 text-sm text-[var(--muted)]"
        >
          ← 終了
        </button>
        <div className="flex items-center gap-1">
          <Link
            href={
              questionSet === "mixed" ? "/retry" : `/retry?set=${questionSet}`
            }
            className="min-h-[44px] rounded-xl px-2 text-sm font-medium text-orange-600 hover:bg-orange-500/10 dark:text-orange-400"
          >
            🤔 苦手
          </Link>
          {source && (
            <button
              type="button"
              onClick={() => setSourceOpen(true)}
              className="min-h-[44px] rounded-xl px-3 text-sm font-medium text-[var(--source)] hover:bg-[var(--source)]/10"
            >
              📎 資料
            </button>
          )}
        </div>
        <span className="text-sm text-[var(--muted)]">
          {index + 1} / {questions.length}
        </span>
        {current && (
          <QuestionActions
            question={current}
            layout="menu"
            onHidden={handleQuestionHidden}
            onEdited={handleQuestionEdited}
          />
        )}
      </header>

      <ProgressBar current={index + 1} total={questions.length} className="mb-6" />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant={questionSetBadgeVariant(current.questionSet)}>
            {QUESTION_SET_LABELS[current.questionSet]}
          </Badge>
          {(current.category === "interview" ||
            current.category === "product-deep-dive") && (
            <Badge variant="tag">{NOTION_CATEGORY_LABELS[current.category]}</Badge>
          )}
          {current.tags.slice(0, 2).map((t) => (
            <Badge key={t} variant="tag">
              {t}
            </Badge>
          ))}
          {isQuestionEdited(current.id) && (
            <Badge variant="tag">編集済</Badge>
          )}
        </div>

        {phase === "question" ? (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold leading-relaxed">{current.prompt}</h2>
            <p className="text-center text-sm text-[var(--muted)]">💭 考えてから見よう</p>

            {format === "multiple-choice" && current.choices && (
              <ul className="space-y-2">
                {current.choices.map((c, i) => (
                  <li
                    key={c}
                    className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm"
                  >
                    {String.fromCharCode(65 + i)}. {c}
                  </li>
                ))}
              </ul>
            )}

            {format === "fill-blank" && (
              <p className="text-sm text-[var(--muted)]">答えを思い浮かべてから確認してください</p>
            )}

            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ（任意）"
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm focus:border-[var(--primary)] focus:outline-none"
            />

            <Button size="lg" onClick={() => setPhase("answer")}>
              答えを見る
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in duration-300">
            <button
              type="button"
              onClick={() => setPhase("question")}
              className="flex min-h-[44px] items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← 問題に戻る
            </button>

            <div>
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">模範回答</p>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{current.answer}</p>
            </div>

            {format === "multiple-choice" && current.choices && (
              <div className="space-y-2">
                {current.choices.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMcSelected(i)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors min-h-[44px]",
                      mcSelected === i
                        ? i === current.correctChoiceIndex
                          ? "border-[var(--known)] bg-[var(--known)]/10"
                          : "border-[var(--unknown)] bg-[var(--unknown)]/10"
                        : "border-[var(--border)]",
                      i === current.correctChoiceIndex &&
                        mcSelected !== null &&
                        mcSelected !== i &&
                        "opacity-60"
                    )}
                  >
                    {String.fromCharCode(65 + i)}. {c}
                    {mcSelected !== null && i === current.correctChoiceIndex && " ✓"}
                  </button>
                ))}
              </div>
            )}

            {format === "fill-blank" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={fillAnswer}
                  onChange={(e) => setFillAnswer(e.target.value)}
                  placeholder="穴埋め回答"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFillChecked(true)}
                >
                  確認
                </Button>
                {fillChecked && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      fillAnswer.trim().toLowerCase() ===
                        current.fillBlankAnswer?.trim().toLowerCase()
                        ? "text-[var(--known)]"
                        : "text-[var(--unknown)]"
                    )}
                  >
                    正解: {current.fillBlankAnswer}
                  </p>
                )}
              </div>
            )}

            {current.keyPoints && current.keyPoints.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">要点チェック</p>
                <ul className="space-y-2">
                  {current.keyPoints.map((kp) => (
                    <li key={kp} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-[var(--muted)]">□</span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SelfGradeButtons onGrade={handleGrade} />
          </div>
        )}
      </div>

      {source && (
        <SourceSheet
          source={source}
          open={sourceOpen}
          onClose={() => setSourceOpen(false)}
        />
      )}
    </div>
  );
}
