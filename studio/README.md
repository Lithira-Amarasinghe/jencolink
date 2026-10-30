# Jencolink Studio

Sanity Studio for the website copy. The Angular site reads the published dataset. The contact form does not go through Sanity; it posts to Web3Forms.

## One-time account steps

These two accounts cannot be created from this repo.

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage). Copy the project ID. The dataset name is `production`.
2. In that project, open **API → CORS origins** and add `http://localhost:4200` plus the live site origin.
3. Create an **Editor** API token.
4. Create a form at [web3forms.com](https://web3forms.com) and copy the access key. That key is meant to live in the browser.

## Local

```bash
cd studio
cp .env.example .env
```

Fill `SANITY_STUDIO_PROJECT_ID` and `SANITY_API_WRITE_TOKEN` in `studio/.env`.

In `Website/public/runtime-config.js`, set the same project ID and the Web3Forms access key:

```js
window.__SANITY_PROJECT_ID__ = 'your-project-id';
window.__SANITY_DATASET__ = 'production';
window.__WEB3FORMS_ACCESS_KEY__ = 'your-access-key';
```

Then:

```bash
npm install
npm run seed
npm run dev
```

Studio runs at http://localhost:3333. The website keeps its built-in copy until the project ID is set and the seed has published.

Production deploys read `sanity-project-id`, `sanity-dataset`, and `web3forms-access-key` from Azure Key Vault and write them into the built `runtime-config.js`.
