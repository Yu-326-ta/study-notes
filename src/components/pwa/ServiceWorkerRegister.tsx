"use client";

import { useEffect } from "react";

/** 開発中は SW を無効化（RSC/HMR との競合で無限 fetch になるため） */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
      void caches.keys().then((keys) => {
        for (const key of keys) {
          void caches.delete(key);
        }
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration optional
    });
  }, []);

  return null;
}
