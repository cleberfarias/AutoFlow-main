# Release notes — merge: refactor/convert-server-js-to-ts

Date: 2026-01-14

Summary:
- Merged branch `refactor/convert-server-js-to-ts` into `main`.
- Converted multiple `server/*.js` modules to TypeScript (`.ts`).
- Updated imports across tests and services to reference the TypeScript modules.
- Removed legacy compatibility stubs and cleaned up runtime imports.
- Ran `tsc --noEmit` and full test suite (`vitest`) — all tests passed (97/97) on merge.

Notes:
- Branch `refactor/convert-server-js-to-ts` was deleted locally and on remote.
- If you want a formal PR record, create a GitHub PR referencing this merge commit.

Maintainer actions performed by automation:
- Committed code and pushed `main`.
- Created annotated tag `ts-conversion-merge` (pushed to origin).

