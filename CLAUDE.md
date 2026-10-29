# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo structure

This is a multi-project repo, not a single app:

- **`studio/`** — Sanity Studio. Editors change services, values, FAQ, section headings, and company details here. The website reads the public dataset.
- **`Website/`** — Angular 20 (standalone components, signals) frontend, project name `gencolink`.
- **`Directus/`** and **`functions/`** — previous CMS and contact-email function. The site no longer calls them. Contact messages post to Web3Forms from the browser.

Integration flow: Sanity query API → `Website/public/runtime-config.js` (`window.__SANITY_PROJECT_ID__`, `window.__SANITY_DATASET__`, `window.__WEB3FORMS_ACCESS_KEY__`) → Angular `SiteContentService` (falls back to defaults if the project id is empty or the fetch fails). Production overwrites `runtime-config.js` in the frontend workflow.

## Setup / running each project

- **Studio**: `npm install` then `npm run dev` from `studio/`. See `studio/README.md` for the Sanity project id, CORS origin, and seed token.
- **Website**: standard Angular CLI — `npm start` (`ng serve`), `npm run build`, `npm test` (Karma/Jasmine via Puppeteer). No lint script configured. Put the Sanity project id and Web3Forms access key in `Website/public/runtime-config.js`.

No CI is configured for this repo yet.

## Code style (Website/)

- Prettier config is inline in `Website/package.json`: `printWidth: 100`, `singleQuote: true`; HTML files use `parser: angular`.
- `tsconfig.json` is strict: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus Angular `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`. Don't loosen these.

## Secrets — do not expose

- `Directus/.env` contains real dev secrets. It's excluded via `Directus/.gitignore`, and a `.git/hooks/pre-commit` hook blocks commits that stage it — don't weaken either without flagging it to the user.
- Never put real credentials in tracked files (READMEs, docs, tfvars.example, compose files). Local secrets live only in gitignored files (`studio/.env`, `Directus/.env`, `functions/local.settings.json`, `infra/terraform/terraform.tfvars`). The Web3Forms access key and Sanity project id belong in `Website/public/runtime-config.js` locally and in GitHub Actions secrets for production. Do not commit a write token.

## Ignore these when exploring/committing

`Website/qa-screenshot.mjs` and `.playwright-mcp/` session dumps are disposable manual-QA artifacts, not part of the app — don't treat them as reference material. `.playwright-mcp/` is gitignored; don't commit new dumps.

## Skills

Two user-triggered skills exist under `.claude/skills/` (both `disable-model-invocation: true`, so they only run via explicit slash command, never auto-invoked):
- `/directus-bootstrap` — starts Directus via Docker Compose and runs the one-time `setup.js` bootstrap.
- `/functions-local-dev` — bootstraps `functions/local.settings.json` from the example file and runs `func start`.
