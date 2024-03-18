# set-metadata.sh
# A script to help reduce easily avoidable merge conflicts during upgrades.
#
# Usage, presuming we are currently on our release 2.0.8,
#        tracking upstream 1.1.353 with the intent to bump to 1.1.354:
#
# $ scripts/set-metadata.sh them 1.1.353  # Revert to the last checkpoint
# $ git merge --no-edit 1.1.354           # Sync to desired tag
# $ scripts/set-metadata.sh us 2.0.9      # Reset metadata to next release

die() {
    echo "$@" >&2
    exit 1
}

modify_packages() {
    target="packages/pyright/package.json"
    while [ -n "$1" ]; do
    case "$1" in
        --name)
            name="$2"; shift 2 || die 'Missing name'
            ;;
        --displayName)
            displayName="$2"; shift 2 || die 'Missing displayName'
            ;;
        --description)
            description="$2"; shift 2 || die 'Missing description'
            ;;
        --version)
            version="$2"; shift 2 || die 'Missing version'
            ;;
        --author)
            author="$2"; shift 2 || die 'Missing author'
            ;;
        --contributors)
            contributors_json="$2"; shift 2 || die 'Missing contributors'
            ;;
        --publisher)
            publisher="$2"; shift 2 || die 'Missing publisher'
            ;;
        *)
            die 'Unknown arguments: $@'
            break
            ;;
    esac
    done

    contents="$(
        jq --indent 4 \
            --arg name "$name" \
            --arg displayName "$displayName" \
            --arg description "$description" \
            --arg version "$version" \
            --arg author "$author" \
            --argjson contributors "$contributors_json" \
            --arg publisher "$publisher" \
            '.
            | .name |= $name
            | .displayName |= $displayName
            | .description |= $description
            | .version |= $version
            | .author |= (.name |= $author)
            | .contributors |= (if $contributors == null then empty else $contributors end)
            | .publisher |= $publisher
            ' \
            < "$target"
    )"
    echo "$contents" > "$target"
}

modify_lock() {
    target="packages/pyright/package-lock.json"
    name="$1"; shift || die 'Missing name'
    version="$1"; shift || die 'Missing version'

    contents="$(
        jq --indent 4 \
            --arg name "$name" \
            --arg version "$version" \
            '.name |= $name
            | .version |= $version
            | .packages[""] |= (.name |= $name | .version |= $version)' \
            < "$target"
    )"
    echo "$contents" > "$target"
}

main() {
    direction="$1"; shift || die 'Missing direction'
    version="$1"; shift || die 'Missing version'
    if [ "$direction" = them ]; then
        modify_packages \
            --name "pyright" \
            --displayName "Pyright" \
            --description "Type checker for the Python language" \
            --version "$version" \
            --author "Microsoft Corporation" \
            --contributors 'null' \
            --publisher "Microsoft Corporation"
        modify_lock "pyright" "$version"
    elif [ "$direction" = us ]; then
        modify_packages \
            --name "@replit/pyright-extended" \
            --displayName "pyright-extended" \
            --description "Extending pyright with yapf + ruff" \
            --version "$version" \
            --author "Replit" \
            --contributors '[{"name":"Microsoft"}]' \
            --publisher "Replit"
        modify_lock "@replit/pyright-extended" "$version"
    fi
}

main "$@"
