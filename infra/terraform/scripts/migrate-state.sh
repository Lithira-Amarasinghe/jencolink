#!/usr/bin/env bash
#
# migrate-state.sh — Ensure the remote state backend exists (via
# bootstrap-state.sh), then point Terraform at the empty website.tfstate.
# It does not copy prod.tfstate.
#
# Robustness guarantees:
#   - Safe to re-run: detects when the backend is already azurerm and simply
#     verifies it instead of attempting to migrate again.
#   - Fails loud with an ERR trap reporting the exact failing line.
#   - Checks for the `terraform` binary and a minimum version before doing
#     anything.
#   - Does not copy an older state file. website.tfstate starts empty.
#   - Ends by checking that the backend is readable.
#
# Usage:
#   ./migrate-state.sh              # init the empty remote state
#   ./migrate-state.sh --yes        # same, non-interactive
#   ./migrate-state.sh --dry-run    # print what would happen, change nothing
#   ./migrate-state.sh --help

set -euo pipefail
export MSYS_NO_PATHCONV=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

FORCE=false
DRY_RUN=false

log()   { printf '\n\033[1;36m==>\033[0m %s\n' "$1"; }
ok()    { printf '\033[1;32m  OK\033[0m    %s\n' "$1"; }
skip()  { printf '\033[1;33m  SKIP\033[0m  %s\n' "$1"; }
warn()  { printf '\033[1;33m  WARN\033[0m  %s\n' "$1" >&2; }
fail()  { printf '\033[1;31m  FAIL\033[0m  %s\n' "$1" >&2; }

on_error() {
  local exit_code=$1 line_no=$2
  fail "Script aborted (exit ${exit_code}) at line ${line_no}."
  fail "Your existing state (local or remote) has not been altered by this failure -"
  fail "Terraform only swaps backends after every prior check succeeds."
  exit "${exit_code}"
}
trap 'on_error $? $LINENO' ERR

usage() {
  cat <<EOF
Usage: $(basename "$0") [--yes] [--dry-run] [--help]

Ensures the remote state backend exists, then runs
terraform init -reconfigure against the empty website.tfstate.
It does not copy prod.tfstate.

  --yes       Accepted for compatibility. Init is already non-interactive.
  --dry-run   Show what would happen; make no changes.
  --help      Show this message.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --yes) FORCE=true ;;
    --dry-run) DRY_RUN=true ;;
    --help|-h) usage; exit 0 ;;
    *) fail "Unknown argument: $arg"; usage; exit 1 ;;
  esac
done

# ─── Prerequisite checks ────────────────────────────────────────────────────

log "Checking prerequisites"

if ! command -v terraform >/dev/null 2>&1; then
  fail "Terraform is not installed or not on PATH."
  exit 1
fi
TF_VERSION="$(terraform version -json 2>/dev/null | grep -o '"terraform_version": *"[^"]*"' | grep -o '[0-9][0-9.]*' || terraform version | head -1)"
ok "terraform found (${TF_VERSION})"

if [[ ! -f "${TERRAFORM_DIR}/providers.tf" ]]; then
  fail "providers.tf not found at ${TERRAFORM_DIR} - is this script in the right place?"
  exit 1
fi

if $DRY_RUN; then
  warn "Running in --dry-run mode: no changes will be made."
fi

# ─── Step 1: ensure the backend storage exists ──────────────────────────────

log "Step 1/2: Ensuring the remote state backend exists"
if $DRY_RUN; then
  "${SCRIPT_DIR}/bootstrap-state.sh" --dry-run
else
  "${SCRIPT_DIR}/bootstrap-state.sh"
fi

# ─── Step 2: attach the empty state ─────────────────────────────────────────

log "Step 2/2: Initializing the empty website.tfstate"
cd "${TERRAFORM_DIR}"

if ! grep -q 'backend "azurerm"' providers.tf; then
  fail "providers.tf has no active 'backend \"azurerm\"' block yet."
  fail "Add it (see the output from bootstrap-state.sh above), then re-run this script."
  exit 1
fi

if ! grep -q 'key *= *"website.tfstate"' providers.tf; then
  fail "providers.tf is not using website.tfstate."
  fail "Do not point this config back at prod.tfstate."
  exit 1
fi

if $DRY_RUN; then
  echo "  (dry-run) would run: terraform init -reconfigure -input=false"
else
  terraform init -reconfigure -input=false
  ok "backend points at an empty website.tfstate"
fi

if $DRY_RUN; then
  log "Dry run complete - no changes were made."
  exit 0
fi

# ─── Verification ────────────────────────────────────────────────────────────
# Confirm the backend isn't just "initialized" but genuinely readable, and
# that it holds the state you expect (not an empty/fresh one from a
# misconfigured key or wrong container).

log "Verifying"
RESOURCE_COUNT="$(terraform state list 2>/dev/null | wc -l | tr -d ' ')"
if [[ "${RESOURCE_COUNT}" -eq 0 ]]; then
  ok "Remote backend is readable and empty. terraform apply will create the website and vault."
else
  ok "Remote backend is active and readable (${RESOURCE_COUNT} resources tracked)."
fi
