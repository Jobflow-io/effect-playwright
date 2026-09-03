---
name: release-version
description: Release and publish a new version of effect-playwright using Jujutsu, git tags, and GitHub Actions.
---

# Release Version Skill

This skill guides you through releasing a new version of `effect-playwright`, managing version numbers, creating Jujutsu (`jj`) commits and git tags, pushing to `origin`, and verifying npm publication.

## Release Channels

- **Prerelease (`next` tag)**: Any version containing a hyphen (e.g. `0.8.0-0`, `0.8.0-1`, `0.8.0-rc.0`). CI publishes these under the `next` dist-tag on npm, leaving `latest` untouched.
- **Stable (`latest` tag)**: Full semantic version without a hyphen (e.g. `0.8.0`, `0.8.1`). CI publishes these under the `latest` dist-tag on npm.

## Procedure

### 1. Pre-flight Verification

Ensure the codebase builds cleanly and all tests and lint checks pass before touching versions:

```bash
pnpm type-check
pnpm test
pnpm check
pnpm build
```

Optional doc check:
```bash
pnpm check-doc-examples
```

Verify that the working copy has no unwanted changes:
```bash
jj status
```

### 2. Bump Version

Update the `"version"` field in `package.json` to the target release version (e.g. `0.8.0-2` or `0.8.0`).

Verify the diff:
```bash
jj diff package.json
```

### 3. Commit and Tag with Jujutsu (`jj`)

1. **Describe the commit**:
   ```bash
   jj describe -m "<version>"
   ```
   *Example:* `jj describe -m "0.8.0-2"`

2. **Create the version tag**:
   Tag names must follow the `v<version>` convention to trigger the publish workflow.
   ```bash
   jj tag set v<version> -r @
   ```
   *Example:* `jj tag set v0.8.0-2 -r @`

   > **Note on Jujutsu immutability:** Setting a tag makes the commit immutable. `jj` will automatically create a new empty working-copy commit on top of it.

3. **Update the `main` bookmark**:
   Move `main` to the release commit (use the commit ID or `@-` if `jj` moved `@` to the child commit):
   ```bash
   jj bookmark set main -r <release-commit-id>
   ```

4. **Verify local history**:
   ```bash
   jj log -r 'ancestors(@, 5)'
   git tag -l "v<version>"
   ```

### 4. Push to Origin

Push both the `main` bookmark and the new tag to `origin`:

```bash
# Optional dry-run
jj git push --bookmark main --tag v<version> --dry-run

# Push
jj git push --bookmark main --tag v<version>
```

Verify bookmarks and tags are synced with origin:
```bash
jj bookmark list --all
jj tag list "v<version>"
```

### 5. Monitor CI & Verify npm Tags

Pushing a `v*` tag triggers `.github/workflows/publish.yml`:
1. It runs the full CI test suite.
2. It detects prereleases (presence of `-` in version) and chooses the `--tag next` or `--tag latest` dist-tag for `pnpm publish`.
3. It publishes to npm via OIDC trusted publishing.

Wait for CI to finish (~1–2 minutes), then verify on npm:

```bash
npm view effect-playwright dist-tags
```

Ensure:
- For prereleases: `next` equals `<version>` and `latest` is still the latest stable version (e.g. `0.7.0`).
- For stable releases: `latest` equals `<version>`.

## Common Gotchas & Troubleshooting

- **OIDC dist-tag restrictions:** npm trusted publishing (OIDC) does not permit running `npm dist-tag add` after publish. CI handles tag selection at publish time via `pnpm publish --tag <tag>`. If manual tag correction is ever needed, an authenticated user token via `npm login` is required.
- **Tag format:** Tags must start with `v` (e.g. `v0.8.0-2`), otherwise the `.github/workflows/publish.yml` push trigger (`tags: ["v*"]`) will not fire.
- **Bookmark tracking:** Always push both `--bookmark main` and `--tag v<version>` so `main` stays in sync with the released commit on GitHub.
