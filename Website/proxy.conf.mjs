// The browser calls this dev server. Node forwards the call to Sanity, so a
// local preview does not need a Sanity CORS origin.
export default {
  '/sanity-api': {
    target: 'https://api.sanity.io',
    secure: true,
    changeOrigin: true,
    router(request) {
      const projectId = request.url.split('/')[2];
      return `https://${projectId}.api.sanity.io`;
    },
    pathRewrite(path) {
      return path.replace(/^\/sanity-api\/[^/]+/, '');
    },
  },
};
