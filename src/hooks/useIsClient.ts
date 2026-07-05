import { useEffect, useState } from "react";

/** SSR と初回クライアント描画を一致させ、localStorage 利用はマウント後に限定 */
export function useIsClient(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
