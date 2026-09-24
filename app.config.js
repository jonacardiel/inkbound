// Extends app.json. On GitHub Pages the site is served from /<repo>/, so the
// web export sets EXPO_PUBLIC_BASE_URL (e.g. "/inkbound"); local dev and the
// Android app leave it unset and are served from the root.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;
  return baseUrl ? { ...config, experiments: { ...config.experiments, baseUrl } } : config;
};
