# Azure login for GitHub Actions

The website workflow logs in with OpenID Connect. It does not store an Azure
password. Create the app once, then save three ids as GitHub secrets.

## 1. App registration and federated credential

Replace the subscription id, then run:

```bash
az ad app create --display-name "jencolink-github-actions"
APP_ID=$(az ad app list --display-name "jencolink-github-actions" --query "[0].appId" -o tsv)
az ad sp create --id "$APP_ID"

SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-master",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:Lithira-Amarasinghe@108219092/jencolink@1286232879:ref:refs/heads/master",
  "audiences": ["api://AzureADTokenExchange"]
}'

az account show --query tenantId -o tsv
echo "$APP_ID"
echo "$SUBSCRIPTION_ID"
```

If an app with that name already exists, skip `az ad app create` and reuse
its app id. GitHub sends the owner id and repository id in the subject.
If a federated credential already exists, edit its subject to the value
above. It must match exactly, including the numbers.

## 2. Hand the app to Terraform

Copy the Application (client) ID into `github_actions_client_id` in
`terraform.tfvars`. Apply then does the rest:

- Creates resource group `jencolink`.
- Grants this app **Contributor** on that group.
- Grants this app **Key Vault Secrets User** on the vault. This is the
  permission that lets the workflow read secrets. Contributor does not.
- Writes `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`
  to GitHub Actions secrets.

Do not add those roles in the portal. A second assignment for the same role
makes apply stop. If one was already added, delete it and run apply again:

```bash
APP_ID=$(az ad app list --display-name "jencolink-github-actions" --query "[0].appId" -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jencolink"

az role assignment delete --assignee "$APP_ID" --role Contributor --scope "$SCOPE"
```
