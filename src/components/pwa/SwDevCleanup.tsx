/** 開発環境で古い Service Worker を即座に解除（React 起動前に実行） */
export function SwDevCleanup() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})});if('caches' in window){caches.keys().then(function(k){k.forEach(function(c){caches.delete(c)})})}})();`,
      }}
    />
  );
}
