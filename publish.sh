#!/usr/bin/env bash
# Publish @djokodonev/jsonschema-editor-react to GitHub Packages.
#
# Usage:  ./publish.sh
# Auth (in order):
#   1. GITHUB_PACKAGES_TOKEN / GH_TOKEN from the environment
#   2. GITHUB_PACKAGES_TOKEN from ../egav-control-plane/backend/.env
#   3. the authenticated GitHub CLI (`gh auth token`)
#
# The token must carry the `write:packages` scope. For the gh CLI:
#   gh auth refresh -h github.com -s write:packages,read:packages
#
# Mirror of egav-billing-frontend/publish.sh — same never-write-token-to-disk
# pattern. Added 2026-08-06 (KAN-679): this repo previously had no publish
# script, so its only release path was a bare `npm publish`, which the
# prepublishOnly guard (scripts/guard-publish-registry.mjs) now refuses.
set -euo pipefail

SDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SDK_DIR"

# ── Auth ────────────────────────────────────────────────────────────────────
TOKEN="${GITHUB_PACKAGES_TOKEN:-${GH_TOKEN:-}}"
if [ -z "$TOKEN" ]; then
  ENV_FILE="$SDK_DIR/../egav-control-plane/backend/.env"
  if [ -f "$ENV_FILE" ]; then
    TOKEN="$(grep '^GITHUB_PACKAGES_TOKEN=' "$ENV_FILE" | head -1 | sed 's/^GITHUB_PACKAGES_TOKEN=//' | tr -d '\r\n' || true)"
  fi
fi
if [ -z "$TOKEN" ] && command -v gh >/dev/null 2>&1; then
  TOKEN="$(gh auth token 2>/dev/null | tr -d '\r\n' || true)"
fi
if [ -z "$TOKEN" ]; then
  echo "ERROR: no token found. Set GITHUB_PACKAGES_TOKEN or GH_TOKEN, add"
  echo "       GITHUB_PACKAGES_TOKEN to egav-control-plane/backend/.env, or log in"
  echo "       with the GitHub CLI carrying write:packages scope:"
  echo "         gh auth refresh -h github.com -s write:packages,read:packages"
  exit 1
fi

# ── Sanity ──────────────────────────────────────────────────────────────────
NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"
echo "Publishing $NAME@$VERSION"

if [ "$NAME" != "@djokodonev/jsonschema-editor-react" ]; then
  echo "ERROR: package name is $NAME — expected @djokodonev/jsonschema-editor-react."
  exit 1
fi

# `npm publish` packs the WORKING TREE, not the last commit — uncommitted work
# would ship silently. Refuse on a dirty tree.
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is dirty. npm publish packs the working tree, not"
  echo "       HEAD, so uncommitted changes would ship. Commit or clean first:"
  git status --short
  exit 1
fi

# ── Build ───────────────────────────────────────────────────────────────────
echo "→ npm run build"
npm run build

# ── Publish (one-shot .npmrc, never written to disk) ────────────────────────
NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
{
  echo "@djokodonev:registry=https://npm.pkg.github.com"
  echo "//npm.pkg.github.com/:_authToken=$TOKEN"
} > "$NPMRC"

echo "→ npm publish"
# Export the token so the project-local .npmrc (which references
# ${GITHUB_PACKAGES_TOKEN}) resolves — project .npmrc overrides --userconfig,
# so the one-shot file alone is not enough.
export GITHUB_PACKAGES_TOKEN="$TOKEN"

# Declare the publish target and the exact artifact for the prepublishOnly
# guard (scripts/guard-publish-registry.mjs, KAN-409). The guard independently
# asks npm where this publish resolves to and refuses if it disagrees with
# EGAV_PUBLISH_REGISTRY — so these are an assertion of intent, not a bypass.
export EGAV_PUBLISH_REGISTRY="https://npm.pkg.github.com"
export EGAV_PUBLISH_RELEASE="$NAME@$VERSION"

npm publish --userconfig="$NPMRC"

echo
echo "✓ Published $NAME@$VERSION to https://npm.pkg.github.com"
echo "  Bump consumers: \"$NAME\": \"^$VERSION\""
