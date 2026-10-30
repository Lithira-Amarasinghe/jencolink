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
| Terraform state | New empty file `website.tfstate` in storage account `gencolinktfstate` |

`runtime-config.js` is a small file the built site loads before Angular.
Locally it lives in `Website/public/runtime-config.js`. On deploy, the
GitHub workflow overwrites the built copy with the Key Vault values.

## What Terraform creates

- One Key Vault.
- Four secret slots: `sanity-project-id`, `sanity-dataset`, `sanity-auth-token`,
  `web3forms-access-key`. The first apply stores the word `pending`. Later
  applies do not change the value.
- One Static Web App (Free).
- Four GitHub Actions secrets: `AZURE_RESOURCE_GROUP`, `AZURE_KEY_VAULT_NAME`,
  `AZURE_SWA_NAME`, `AZURE_SWA_DEPLOYMENT_TOKEN`.

Terraform does not create a database, a storage account for the site, or an
app service. State starts empty. It does not know about resources you
already deleted, and it will not try to delete or recreate them.

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

Use a new `terraform.tfvars` from the example. An older file still lists
Directus, SQL, and Functions settings, and Terraform will refuse it.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init -reconfigure
terraform plan
terraform apply
```

`terraform init` may ask to copy the old `prod.tfstate`. Answer **no**.
`-reconfigure` keeps the new `website.tfstate` empty. The plan should only
create the vault, the three secret slots, the website, and the GitHub secrets.

There is no workflow that runs Terraform. You apply it yourself.

## Fill the vault

In the Azure portal, open the vault named in `terraform output key_vault_name`
and set:

| Secret | Value |
|--------|--------|
| `sanity-project-id` | Sanity project id |
| `sanity-dataset` | `production`, or your dataset name |
| `sanity-auth-token` | Sanity Developer token. This deploys the Studio. |
| `web3forms-access-key` | Web3Forms access key |

Do not run apply again expecting it to change these. It will not.
If the vault was created before `sanity-auth-token` existed, run apply once
more so that empty slot is created, then set its value.

## Deploy the website

Push `Website/` to `master`, or run the **Frontend (Angular)** workflow by
hand on `master`.

The workflow builds the Angular app, logs in to Azure with OIDC, reads the
three secrets, writes `runtime-config.js`, and uploads the site to the
Static Web App. A pull request only builds. It does not read the vault and
does not deploy.

The workflow stops if `sanity-project-id` or `web3forms-access-key` is still
`pending`. An empty or `pending` dataset becomes `production`.

## Deploy the editor

Push `studio/` to `master`, or run the **Studio (Sanity)** workflow by hand
on `master`.

The workflow logs in to Azure, reads `sanity-auth-token` from Key Vault, and
runs `npm run deploy`. Sanity hosts the editor at
`https://jencolink.sanity.studio`. It is not part of the Static Web App.

A pull request only builds the Studio. It does not deploy. The workflow stops
if `sanity-auth-token` or `sanity-project-id` is still `pending`.

In Sanity manage, allow CORS for `http://localhost:4200` and for the live site URL.

## Still done by hand

- `terraform apply`
- The three OIDC GitHub secrets
- The four Key Vault values, including the Sanity Developer token
- A custom domain, if you add one later
