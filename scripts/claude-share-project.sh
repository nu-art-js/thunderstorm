#!/usr/bin/env bash
# =============================================================================
# claude-share-project.sh
#
# Grants 'claude-dev' access to one or more project directories.
# Run this whenever you start a new project you want Claude to work on.
#
# Usage:
#   sudo ./claude-share-project.sh /path/to/project [/path/to/other ...]
#
# To revoke access:
#   sudo ./claude-share-project.sh --revoke /path/to/project
# =============================================================================
set -euo pipefail

CLAUDE_USER="claude-dev"

info()    { echo "  [·] $*"; }
success() { echo "  [✓] $*"; }
warn()    { echo "  [!] $*"; }
die()     { echo "  [✗] $*" >&2; exit 1; }

require_root() {
    [[ $EUID -eq 0 ]] || die "Run with sudo: sudo $0 $*"
}

check_claude_user() {
    id "$CLAUDE_USER" &>/dev/null || die "'$CLAUDE_USER' user not found. Run claude-user-setup.sh first."
}

share() {
    local dir="$1"
    [[ -d "$dir" ]] || die "Directory not found: $dir"

    info "Sharing '$dir' with '$CLAUDE_USER'..."
    chmod +a "$CLAUDE_USER allow read,write,execute,delete,add_file,add_subdirectory,file_inherit,directory_inherit" "$dir"
    success "Shared: $dir"
}

revoke() {
    local dir="$1"
    [[ -d "$dir" ]] || die "Directory not found: $dir"

    info "Revoking '$CLAUDE_USER' access to '$dir'..."
    chmod -a "$CLAUDE_USER allow read,write,execute,delete,add_file,add_subdirectory,file_inherit,directory_inherit" "$dir" 2>/dev/null || true
    success "Revoked: $dir"
}

main() {
    require_root
    check_claude_user

    local revoke_mode=false
    local dirs=()

    for arg in "$@"; do
        case "$arg" in
            --revoke) revoke_mode=true ;;
            *)        dirs+=("$arg") ;;
        esac
    done

    [[ ${#dirs[@]} -gt 0 ]] || die "Usage: sudo $0 [--revoke] /path/to/project ..."

    for dir in "${dirs[@]}"; do
        if $revoke_mode; then
            revoke "$dir"
        else
            share "$dir"
        fi
    done
}

main "$@"
