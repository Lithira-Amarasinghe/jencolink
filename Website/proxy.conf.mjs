// Local preview calls /sanity-api on this dev server. Node reads studio/.env
// and forwards the call to that project, so the browser does not need CORS
// and does not use a second copy of the project id.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioEnvPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'studio', '.env');

function decodeEnv(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const left = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = left;
    }
    return swapped.toString('utf16le');
  }
  const text = buffer.toString('utf8');
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function studioSettings() {
  const settings = { projectId: '', dataset: 'production' };
  if (!existsSync(studioEnvPath)) return settings;
  const raw = decodeEnv(readFileSync(studioEnvPath));
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (match[1] === 'SANITY_STUDIO_PROJECT_ID') settings.projectId = value.trim().toLowerCase();
    if (match[1] === 'SANITY_STUDIO_DATASET' && value.trim()) settings.dataset = value.trim();
  }
  return settings;
}

export default {
  '/sanity-api': {
    target: 'https://api.sanity.io',
    secure: true,
    changeOrigin: true,
    // The dev server only understands this object form. A function is ignored,
    // and the old path is then sent to Sanity, which answers 404.
    pathRewrite: {
      '^/sanity-api': '',
    },
    configure(proxy) {
      const forward = proxy.web.bind(proxy);
      proxy.web = (request, response, options = {}) => {
        const { projectId, dataset } = studioSettings();
        if (!/^[a-z0-9]+$/.test(projectId)) {
          response.statusCode = 404;
          response.setHeader('content-type', 'text/plain; charset=utf-8');
          response.end(
            'studio/.env is missing a valid SANITY_STUDIO_PROJECT_ID. The website reads that file.',
          );
          return;
        }
        if (request.url) {
          request.url = request.url.replace(/\/data\/query\/[^/?]+/, `/data/query/${dataset}`);
        }
        forward(request, response, {
          ...options,
          target: `https://${projectId}.api.sanity.io`,
        });
      };
    },
  },
};
