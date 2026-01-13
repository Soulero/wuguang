#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
One-command deploy for img-enhancer-web.

What it does:
- rsync current project to the server
- docker compose rebuild + restart

Usage:
  bash scripts/deploy.sh

Options:
  -h, --help   Show this help

Overrides (optional env vars):
  DEPLOY_SERVER=root@1.2.3.4
  DEPLOY_DIR=/opt/img-enhancer-web
  DEPLOY_CONTAINER=img-enhancer-web

Example:
  DEPLOY_SERVER=root@175.27.244.92 bash scripts/deploy.sh
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

DEPLOY_SERVER="${DEPLOY_SERVER:-root@175.27.244.92}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/img-enhancer-web}"
DEPLOY_CONTAINER="${DEPLOY_CONTAINER:-img-enhancer-web}"

LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Keep SSH non-interactive and avoid host key prompts on first connect.
SSH_OPTS=(
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
  -o ServerAliveInterval=30
)

RSYNC_OPTS=(
  -az
  --delete
  --exclude node_modules
  --exclude .next
  --exclude .env.local
  --exclude .env
  --exclude .devserver.log
  --exclude .git
  --exclude .DS_Store
)

RSYNC_SSH_CMD="ssh ${SSH_OPTS[*]}"

echo "[deploy] local:  ${LOCAL_DIR}"
echo "[deploy] remote: ${DEPLOY_SERVER}:${DEPLOY_DIR}"

echo "[deploy] syncing files via rsync..."
rsync -e "${RSYNC_SSH_CMD}" "${RSYNC_OPTS[@]}" "${LOCAL_DIR}/" "${DEPLOY_SERVER}:${DEPLOY_DIR}/"

echo "[deploy] rebuilding and restarting via docker compose..."
ssh "${SSH_OPTS[@]}" "${DEPLOY_SERVER}" "cd \"${DEPLOY_DIR}\" && docker compose up -d --build"

echo "[deploy] status:"
ssh "${SSH_OPTS[@]}" "${DEPLOY_SERVER}" "docker ps --filter name=\"${DEPLOY_CONTAINER}\" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' || true"

echo "[deploy] latest logs:"
ssh "${SSH_OPTS[@]}" "${DEPLOY_SERVER}" "docker logs -n 30 \"${DEPLOY_CONTAINER}\" || true"

echo "[deploy] done"
