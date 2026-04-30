#!/usr/bin/env bash
# =============================================================================
# claude-user-setup.sh
#
# One-time setup: creates an isolated 'claude-dev' macOS user for Claude Code.
# Claude runs as claude-dev, which can only see projects you explicitly share.
# Your credentials (~/.ssh, ~/.aws, etc.) are never visible to it.
#
# Run once per developer machine:
#   sudo ./claude-user-setup.sh [project-dir ...]
#
# Add more projects later:
#   sudo ./claude-share-project.sh /path/to/project
#
# Start a session:
#   claude-session          (cd to your project first)
# =============================================================================
set -euo pipefail

# ── Constants ─────────────────────────────────────────────────────────────────

CLAUDE_USER="claude-dev"
CLAUDE_HOME="/Users/$CLAUDE_USER"
CLAUDE_REALNAME="Claude Dev"
SUDOERS_FILE="/etc/sudoers.d/claude-dev"
SHELL_HELPER_FUNCTION='
# Claude Code isolated session — starts claude-dev shell in your current directory.
claude-session() {
    local dir="${1:-$PWD}"
    echo "→ Starting Claude session as claude-dev in: $dir"
    sudo -u claude-dev zsh -l -c "cd $(printf %q "$dir") && exec zsh"
}
'

# ── Helpers ───────────────────────────────────────────────────────────────────

info()    { echo "  [·] $*"; }
success() { echo "  [✓] $*"; }
warn()    { echo "  [!] $*"; }
die()     { echo "  [✗] $*" >&2; exit 1; }

require_root() {
    [[ $EUID -eq 0 ]] || die "Run with sudo: sudo $0 $*"
}

# The user who invoked sudo (the real developer, not root).
calling_user() {
    echo "${SUDO_USER:-$USER}"
}

calling_user_home() {
    eval echo "~$(calling_user)"
}

# ── Steps ─────────────────────────────────────────────────────────────────────

create_claude_user() {
    if id "$CLAUDE_USER" &>/dev/null; then
        success "User '$CLAUDE_USER' already exists"
        return
    fi

    info "Creating user '$CLAUDE_USER'..."

    # Find an unused UID > 500 (macOS interactive user range).
    local next_uid
    next_uid=$(dscl . -list /Users UniqueID | awk '{print $2}' | sort -n | awk 'BEGIN{u=501} $1>=u{u=$1+1} END{print u}')

    sysadminctl -addUser "$CLAUDE_USER" \
        -fullName "$CLAUDE_REALNAME" \
        -UID "$next_uid" \
        -shell /bin/zsh \
        -home "$CLAUDE_HOME" 2>/dev/null || {
        # sysadminctl may not be available on all versions; fall back to dscl.
        dscl . -create "/Users/$CLAUDE_USER"
        dscl . -create "/Users/$CLAUDE_USER" UserShell /bin/zsh
        dscl . -create "/Users/$CLAUDE_USER" RealName "$CLAUDE_REALNAME"
        dscl . -create "/Users/$CLAUDE_USER" UniqueID "$next_uid"
        dscl . -create "/Users/$CLAUDE_USER" PrimaryGroupID 20
        dscl . -create "/Users/$CLAUDE_USER" NFSHomeDirectory "$CLAUDE_HOME"
    }

    # Create home directory.
    createhomedir -c -u "$CLAUDE_USER" &>/dev/null || mkdir -p "$CLAUDE_HOME"
    chown "$CLAUDE_USER":staff "$CLAUDE_HOME"

    success "Created user '$CLAUDE_USER' (UID $next_uid)"
}

configure_sudoers() {
    local caller
    caller=$(calling_user)

    if [[ -f "$SUDOERS_FILE" ]] && grep -q "$caller" "$SUDOERS_FILE" 2>/dev/null; then
        success "Sudoers already configured for '$caller'"
        return
    fi

    info "Configuring passwordless sudo for '$caller' → '$CLAUDE_USER'..."

    # Append (don't replace) so multiple developers can share the same file.
    echo "$caller ALL=($CLAUDE_USER) NOPASSWD: ALL" >> "$SUDOERS_FILE"
    chmod 440 "$SUDOERS_FILE"

    # Validate the sudoers file before leaving it in place.
    visudo -c -f "$SUDOERS_FILE" || {
        rm -f "$SUDOERS_FILE"
        die "sudoers syntax error — file removed. Re-run setup."
    }

    success "Sudoers configured: '$caller' can sudo as '$CLAUDE_USER' without password"
}

install_shell_helper() {
    local caller
    caller=$(calling_user)
    local caller_home
    caller_home=$(calling_user_home)

    local rc_file="$caller_home/.zshrc"

    if grep -q "claude-session" "$rc_file" 2>/dev/null; then
        success "Shell helper 'claude-session' already in $rc_file"
        return
    fi

    info "Adding 'claude-session' function to $rc_file..."
    echo "$SHELL_HELPER_FUNCTION" >> "$rc_file"
    chown "$caller" "$rc_file"

    success "Added — run 'source ~/.zshrc' or open a new terminal to activate"
}

set_api_key() {
    local caller
    caller=$(calling_user)

    # Check if key is already set.
    if sudo -u "$CLAUDE_USER" bash -c 'grep -q ANTHROPIC_API_KEY ~/.zshrc 2>/dev/null'; then
        success "ANTHROPIC_API_KEY already set in $CLAUDE_HOME/.zshrc"
        return
    fi

    echo ""
    echo "  Enter the Anthropic API key for '$CLAUDE_USER' on this machine."
    echo "  (Each developer uses their own key. Leave blank to skip and set manually later.)"
    echo -n "  ANTHROPIC_API_KEY: "
    read -r -s api_key
    echo ""

    if [[ -z "$api_key" ]]; then
        warn "Skipped. Set it later: sudo -u $CLAUDE_USER bash -c 'echo export ANTHROPIC_API_KEY=sk-... >> ~/.zshrc'"
        return
    fi

    sudo -u "$CLAUDE_USER" bash -c "echo 'export ANTHROPIC_API_KEY=$api_key' >> ~/.zshrc"
    success "API key stored in $CLAUDE_HOME/.zshrc"
}

configure_git() {
    info "Configuring git for '$CLAUDE_USER'..."

    local caller
    caller=$(calling_user)

    # Copy caller's git identity so commits look right.
    local git_name git_email
    git_name=$(sudo -u "$caller" git config --global user.name 2>/dev/null || echo "")
    git_email=$(sudo -u "$caller" git config --global user.email 2>/dev/null || echo "")

    [[ -n "$git_name" ]]  && sudo -u "$CLAUDE_USER" git config --global user.name  "$git_name"
    [[ -n "$git_email" ]] && sudo -u "$CLAUDE_USER" git config --global user.email "$git_email"

    # Use HTTPS + credential store (token-based, no SSH key needed).
    sudo -u "$CLAUDE_USER" git config --global credential.helper store

    echo ""
    echo "  '$CLAUDE_USER' will use HTTPS for git (no SSH key access)."
    echo "  Create a GitHub token with limited scope (Contents: read/write, no admin):"
    echo "  https://github.com/settings/tokens/new"
    echo ""
    echo "  Then store it once:"
    echo "  sudo -u $CLAUDE_USER git clone https://<token>@github.com/org/repo /tmp/auth-test && rm -rf /tmp/auth-test"
    echo "  (credentials are saved automatically after first successful use)"
    echo ""

    success "Git identity configured for '$CLAUDE_USER'"
}

install_claude_cli() {
    if sudo -u "$CLAUDE_USER" bash -lc 'which claude' &>/dev/null; then
        success "Claude Code CLI already installed for '$CLAUDE_USER'"
        return
    fi

    info "Installing Claude Code CLI for '$CLAUDE_USER'..."

    # Detect node — use the system's npm if available.
    local npm_path
    npm_path=$(which npm 2>/dev/null) || die "npm not found. Install Node.js first, then re-run."

    sudo -u "$CLAUDE_USER" "$npm_path" install -g @anthropic-ai/claude-code --quiet

    success "Claude Code CLI installed"
}

share_projects() {
    local projects=("$@")
    [[ ${#projects[@]} -eq 0 ]] && return

    info "Sharing project directories with '$CLAUDE_USER'..."
    for dir in "${projects[@]}"; do
        if [[ ! -d "$dir" ]]; then
            warn "Directory not found, skipping: $dir"
            continue
        fi
        # Apply ACL recursively via directory_inherit + file_inherit.
        chmod +a "$CLAUDE_USER allow read,write,execute,delete,add_file,add_subdirectory,file_inherit,directory_inherit" "$dir"
        success "Shared: $dir"
    done
}

print_summary() {
    local caller
    caller=$(calling_user)

    echo ""
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│  claude-dev is ready                                    │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
    echo "  Start a session (from any shared project directory):"
    echo "    claude-session"
    echo ""
    echo "  Share a new project later:"
    echo "    sudo $(dirname "$0")/claude-share-project.sh /path/to/project"
    echo ""
    echo "  What claude-dev CANNOT access:"
    echo "    ~/.ssh  ~/.aws  ~/.config  ~/Documents  (your home dir)"
    echo ""
    echo "  Source your shell config to activate the helper function:"
    echo "    source ~/.zshrc"
    echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────

main() {
    require_root

    echo ""
    echo "Setting up isolated Claude Code user on this machine..."
    echo ""

    create_claude_user
    configure_sudoers
    install_shell_helper
    install_claude_cli
    set_api_key
    configure_git
    share_projects "$@"
    print_summary
}

main "$@"
