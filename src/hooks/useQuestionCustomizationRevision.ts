"use client";

import { useEffect, useState } from "react";
import { CUSTOMIZATION_CHANGED_EVENT } from "@/lib/question-customizations";

/** 問題の非表示・編集が変わったら再レンダリング用 */
export function useQuestionCustomizationRevision(): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const onChange = () => setRevision((v) => v + 1);
    window.addEventListener(CUSTOMIZATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CUSTOMIZATION_CHANGED_EVENT, onChange);
  }, []);

  return revision;
}
