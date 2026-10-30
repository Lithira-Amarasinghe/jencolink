# Deployment

Azure hosts the website and a Key Vault. Sanity hosts the content and the
editing studio. The contact form posts to Web3Forms from the browser.

| Piece | Where it runs |
|-------|----------------|
| Website | Azure Static Web App |
| Secrets | Azure Key Vault. You type the three content values. |
| Content | Sanity content API |
| Editing UI | Sanity Studio at `https://jencolink.sanity.studio` |
| Contact | Web3Forms |
| Terraform state | Storage account `gencolinktfstate` (already created, outside this config) |

`runtime-config.js` is a small file the built site loads before Angular.
Locally it lives in `Website/public/runtime-config.js`. On deploy, the
GitHub workflow overwrites the built copy with the Key Vault values.

## What Terraform creates

- One Key Vault.
- Three secret slots: `sanity-project-id`, `sanity-dataset`, `web3forms-access-key`.
  The first apply stores the word `pending`. Later applies do not change the value.
- One Static Web App (Free).
- Four GitHub Actions secrets: `AZURE_RESOURCE_GROUP`, `AZURE_KEY_VAULT_NAME`,
  `AZURE_SWA_NAME`, `AZURE_SWA_DEPLOYMENT_TOKEN`.

Terraform does not create a database, a storage account for the site, or an
app service. An apply against the previous state removes the old Directus
app, SQL database, upload storage, functions app, and their network.

## One-time setup

1. Resource group `gencolink` already exists. Terraform reads it.
2. State storage already exists. See git history if you ever need to recreate it.
3. GitHub OIDC app. See [AZURE_OIDC_SETUP.md](../AZURE_OIDC_SETUP.md).
   Put these three in GitHub Actions secrets yourself:
   `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
4. A GitHub PAT with Actions read/write on this repo. Export it as
   `GITHUB_TOKEN` in the shell you use for Terraform. Do not put it in
   `terraform.tfvars`.
5. Copy the example vars and set the GitHub owner plus the OIDC client id:

   ```bash
   cd infra/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

   Set `github_actions_client_id` to the same value as `AZURE_CLIENT_ID`.
   That grants the workflow permission to read Key Vault. If you leave it
   empty, assign **Key Vault Secrets User** on the vault to the GitHub app
   yourself after apply.

## Apply

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

There is no workflow that runs Terraform. You apply it yourself.

Read the plan before you confirm. If this environment was applied before,
the plan deletes the old Directus app, SQL server, storage account, and
Functions app.

## Fill the vault

In the Azure portal, open the vault named in `terraform output key_vault_name`
and set:

| Secret | Value |
|--------|--------|
| `sanity-project-id` | Sanity project id |
| `sanity-dataset` | `production`, or your dataset name |
| `web3forms-access-key` | Web3Forms access key |

Do not run apply again expecting it to change these. It will not.

## Deploy the website

Push `Website/` to `master`, or run the **Frontend (Angular)** workflow by
hand on `master`.

The workflow builds the Angular app, logs in to Azure with OIDC, reads the
three secrets, writes `runtime-config.js`, and uploads the site to the
Static Web App. A pull request only builds. It does not read the vault and
does not deploy.

The workflow stops if `sanity-project-id` or `web3forms-access-key` is still
`pending`. An empty or `pending` dataset becomes `production`.

## Studio

From `studio/`, after `studio/.env` has the project id:

```bash
npm run deploy
```

That publishes the editor to `https://jencolink.sanity.studio`. Sanity hosts
it. It is not part of the Static Web App. In Sanity manage, allow CORS for
`http://localhost:4200` and for the live site URL.

## Still done by hand

- `terraform apply`
- The three OIDC GitHub secrets
- The three Key Vault values
- `npm run deploy` inside `studio/`
- A custom domain, if you add one later
