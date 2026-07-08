import { Suspense } from "react";
import { RetryStudyClient } from "@/components/study/RetryStudyClient";

export default function RetryPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center">読み込み中...</div>}>
      <RetryStudyClient />
    </Suspense>
  );
}
