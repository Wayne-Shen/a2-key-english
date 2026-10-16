(() => {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    const root = new URL('./', document.currentScript.src);
    const hadController = !!navigator.serviceWorker.controller;
    function notifyUpdate() {
      if (!hadController || document.getElementById('course-update-notice')) return;
      const notice = document.createElement('div');
      notice.id = 'course-update-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('lang', 'en');
      notice.style.cssText = 'position:fixed;bottom:max(16px,env(safe-area-inset-bottom));left:16px;right:16px;z-index:1000;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:12px;padding:14px 18px;background:#fff;border:1px solid #b7c8f2;border-radius:16px;box-shadow:0 8px 32px #24325233;font:14px/1.6 system-ui;color:#26344b';
      const text = document.createElement('span');
      text.textContent = 'An update is ready. Refresh to use it. Your progress and downloaded audio will be kept.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Refresh to update';
      button.style.cssText = 'min-height:44px;padding:10px 16px;background:#3455dc;color:white;border:0;border-radius:10px;font:inherit;cursor:pointer';
      button.onclick = () => location.reload();
      notice.append(text, button);
      document.body.append(notice);
    }
    navigator.serviceWorker.addEventListener('controllerchange', notifyUpdate);
    navigator.serviceWorker.register(new URL('sw.js', root), {scope: root.pathname, updateViaCache: 'none'})
      .then(registration => {
        let lastCheck = Date.now();
        function check() {
          if (!document.hidden && navigator.onLine && Date.now() - lastCheck > 60000) {
            lastCheck = Date.now();
            registration.update().catch(() => {});
          }
        }
        window.addEventListener('online', () => { lastCheck = 0; check(); });
        document.addEventListener('visibilitychange', check);
      })
      .catch(() => { /* The offline dashboard reports setup failures and offers retry. */ });
  }
})();
