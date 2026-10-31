// Local preview calls /sanity-api on this dev server. Node forwards it to
// https://<projectId>.api.sanity.io so the browser is not blocked by CORS.
// pathRewrite must be an object: the dev server ignores a function.
export default {
  '/sanity-api': {
    target: 'https://api.sanity.io',
    secure: true,
    changeOrigin: true,
    pathRewrite: {
      '^/sanity-api': '',
    },
    configure(proxy) {
      const forward = proxy.web.bind(proxy);
      proxy.web = (request, response, options = {}) => {
        const projectId = String(request.headers['x-sanity-project'] ?? '');
        if (!/^[a-z0-9]+$/.test(projectId)) {
          response.statusCode = 404;
          response.end('Missing Sanity project id');
          return;
        }
        forward(request, response, {
          ...options,
          target: `https://${projectId}.api.sanity.io`,
        });
      };
    },
  },
};
