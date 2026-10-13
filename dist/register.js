(() => {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    const root = new URL('./', document.currentScript.src);
    navigator.serviceWorker.register(new URL('sw.js', root), {scope: root.pathname, updateViaCache: 'none'})
      .catch(() => { /* The offline dashboard reports setup failures and offers retry. */ });
  }
})();
