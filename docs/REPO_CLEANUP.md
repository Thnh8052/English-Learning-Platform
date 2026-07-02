# Repository Cleanup Notes

## Current Policy

These files should not be committed:

- `node_modules/`
- `dist/` and other build outputs
- `.env` and `.env.*` except `.env.example`
- uploads and temporary upload folders
- logs and local editor files

These files should be committed:

- `backend/package-lock.json`
- `frontend/package-lock.json`
- `.env.example` files
- project documentation under `docs/`

## Git History Cleanup

The old history included generated dependency files under root `node_modules/` and a root `package-lock.json`. The production cleanup should remove those paths from all commits, then force-push the cleaned `main` branch.

Recommended cleanup targets:

```text
node_modules/
package-lock.json
```

After rewriting history, verify with:

```bash
git rev-list --objects --all | grep node_modules
git rev-list --objects --all | grep package-lock.json
git status --short
```

The expected result is no root `node_modules/` objects and no root `package-lock.json` in history. Workspace lockfiles under `backend/` and `frontend/` should remain.
