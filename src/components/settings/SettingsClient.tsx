"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useIsClient } from "@/hooks/useIsClient";
import { DEFAULT_SETTINGS, type StudySettings } from "@/domain/progress";
import {
  exportAllData,
  importAllData,
  loadSettings,
  saveSettings,
  type ExportBundle,
} from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { HiddenQuestionsSection } from "./HiddenQuestionsSection";

export function SettingsClient() {
  const mounted = useIsClient();
  const [version, setVersion] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const settings = mounted ? loadSettings() : DEFAULT_SETTINGS;
  void version;

  const update = (patch: Partial<StudySettings>) => {
    const next = { ...loadSettings(), ...patch };
    saveSettings(next);
    setVersion((v) => v + 1);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-quiz-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("エクスポートしました");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as ExportBundle;
        if (data.version !== 1) throw new Error("unsupported version");
        importAllData(data);
        setVersion((v) => v + 1);
        setMessage("インポートしました。");
      } catch {
        setMessage("インポートに失敗しました。ファイル形式を確認してください。");
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) return <div className="py-8">読み込み中...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">設定</h1>

      {message && (
        <p className="rounded-xl bg-[var(--primary)]/10 px-4 py-3 text-sm text-[var(--primary)]">
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">学習</h2>

        <label className="flex items-center justify-between gap-4 min-h-[44px]">
          <span className="text-sm">1 セッションの問題数</span>
          <select
            value={settings.sessionSize}
            onChange={(e) => update({ sessionSize: Number(e.target.value) })}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n} 問
              </option>
            ))}
          </select>
        </label>

        <Toggle
          label="カテゴリ混在（本編内）"
          checked={settings.interleave}
          onChange={(v) => update({ interleave: v })}
        />
        <Toggle
          label="考える時間プロンプト"
          checked={settings.thinkingPrompt}
          onChange={(v) => update({ thinkingPrompt: v })}
        />
        <Toggle
          label="混合モード（本編+周辺知識）"
          description="Phase 3: 同一セッションで両方の問題集を出題"
          checked={settings.mixedMode}
          onChange={(v) => update({ mixedMode: v })}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">非表示の問題</h2>
        <p className="text-sm text-[var(--muted)]">
          学習中に非表示にした問題を確認・復元できます。
          <Link href="/questions/hidden" className="ml-1 font-medium text-[var(--primary)]">
            非表示の問題一覧
          </Link>
        </p>
        <HiddenQuestionsSection />
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="font-semibold">データ</h2>
        <Button variant="secondary" size="lg" onClick={handleExport}>
          進捗をエクスポート
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
        />
        <Button
          variant="secondary"
          size="lg"
          onClick={() => fileRef.current?.click()}
        >
          進捗をインポート
        </Button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)]">
        <h2 className="mb-2 font-semibold text-[var(--foreground)]">PWA</h2>
        <p>
          ホーム画面に追加するとオフラインでも学習できます。Service Worker が問題データをキャッシュします。
        </p>
      </section>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 min-h-[44px]">
      <div>
        <span className="text-sm">{label}</span>
        {description && (
          <p className="text-xs text-[var(--muted)]">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--primary)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
