#!/bin/bash

# Publish @nu-art packages from the project that contains this checkout as _thunderstorm.
# The npm token comes from the login keychain item "npm-token".
# The project .npmrc written for that publish is removed on exit.

set -euo pipefail

VERSION=${1:-}
if [[ -z "$VERSION" || "$VERSION" == *[!0-9.]* ]]; then
	echo "Usage: $0 <version>"
	echo "Example: $0 0.500.7"
	exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
if [[ -f "$SCRIPT_DIR/version-thunderstorm.json" ]]; then
	TS_ROOT=$SCRIPT_DIR
else
	TS_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
fi

if [[ "$(basename "$TS_ROOT")" != "_thunderstorm" ]]; then
	echo "This script must run from a project whose Thunderstorm checkout is named _thunderstorm."
	echo "Found: $TS_ROOT"
	exit 1
fi

PROJECT_ROOT=$(cd "$TS_ROOT/.." && pwd)
if [[ ! -f "$PROJECT_ROOT/bai-config.json" || ! -f "$PROJECT_ROOT/build-and-install.sh" ]]; then
	echo "Project root $PROJECT_ROOT is missing bai-config.json or build-and-install.sh"
	exit 1
fi

NPMRC="$PROJECT_ROOT/.npmrc"
NPMRC_BACKUP=""
WROTE_NPMRC=0
CLEANED=0

cleanup() {
	if [[ "$CLEANED" -eq 1 ]]; then
		return
	fi
	CLEANED=1
	if [[ -n "$NPMRC_BACKUP" ]]; then
		mv "$NPMRC_BACKUP" "$NPMRC"
	elif [[ "$WROTE_NPMRC" -eq 1 ]]; then
		rm -f "$NPMRC"
	fi
}
trap cleanup EXIT INT TERM HUP

NPM_TOKEN=$(security find-generic-password -s npm-token -w)
export NPM_TOKEN

if [[ -e "$NPMRC" ]]; then
	NPMRC_BACKUP=$(mktemp)
	cp "$NPMRC" "$NPMRC_BACKUP"
fi
printf '%s\n' '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > "$NPMRC"
WROTE_NPMRC=1

git -C "$TS_ROOT" tag "v${VERSION}"

sed -i '' "s/\"THUNDERSTORM_VERSION\": \"[^\"]*\"/\"THUNDERSTORM_VERSION\": \"${VERSION}\"/" "$PROJECT_ROOT/bai-config.json"
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "$TS_ROOT/version-thunderstorm.json"

cd "$PROJECT_ROOT"
bash build-and-install.sh --publish -up=@nu-art --debug
