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
az role assignment create \
  --assignee "$APP_ID" \
  --role Contributor \
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/gencolink"

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

## 2. GitHub secrets

Repository → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|--------|
| `AZURE_CLIENT_ID` | app id (`APP_ID`) |
| `AZURE_TENANT_ID` | tenant id |
| `AZURE_SUBSCRIPTION_ID` | subscription id |

Terraform writes the other GitHub secrets (resource group, vault name, site
name, deploy token).

## 3. Let the workflow read Key Vault

Contributor does not allow reading secret values. Either set
`github_actions_client_id` in `terraform.tfvars` to `APP_ID` before apply,
or after the vault exists:

```bash
VAULT_ID=$(az keyvault show -n YOUR_VAULT_NAME -g gencolink --query id -o tsv)
az role assignment create \
  --assignee "$APP_ID" \
  --role "Key Vault Secrets User" \
  --scope "$VAULT_ID"
```
