// Registers the service worker that keeps the web app working offline (and
// lets iPhones "Add to Home Screen" as an app). Production builds only: in
// development it would cache stale code.
export function registerOffline() {
  if (__DEV__ || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const base = process.env.EXPO_PUBLIC_BASE_URL ?? '';
  const register = () => navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => undefined);
  // Wait for the page to finish loading so caching doesn't compete with it,
  // unless it already has (the app bundle often runs after the load event).
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
}
