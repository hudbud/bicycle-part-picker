# Pedal Parts Picker — Improvement Plan

Context for the implementing agent: Vite + React 18 + react-router 6 + zustand (persist → localStorage) + react95/styled-components. No backend. Deployed on Vercel as a static SPA. The product decision driving this plan: **remove auth entirely and go local-first** — all data lives in localStorage, with file export/import for backup and moving between devices.

Verified findings below reference the files to change. Work is ordered in phases; each phase is independently shippable.

---

## Phase 1 — Remove auth, go fully local-first

The current auth is mock-only (`src/store/authStore.ts` stores `btoa(password)` in localStorage) and gates Garage and Parts Bin for no benefit — the data behind the gate is device-local anyway.

1. Delete `src/store/authStore.ts`, `src/types/auth.ts`, `src/components/auth/` (AuthModal, LoginForm, SignupForm).
2. `src/pages/GaragePage.tsx` and `src/pages/PartsPage.tsx`: remove the `isAuthenticated` branches and auth modals — render content unconditionally.
3. `src/components/builder/SaveBuildDialog.tsx`: remove `onNeedAuth` / `isAuthenticated` check; save directly. Replace `ownerName: user?.displayName` with an optional free-text "Builder name (shown on shared builds)" field persisted in a small settings store (or drop ownerName entirely).
4. `src/components/layout/TopBar.tsx` / `MobileNav.tsx`: remove Sign in button / user area.
5. Remove the `isPublic` Public/Private radio in SaveBuildDialog and `isPublic` from `src/types/build.ts` — it is never enforced anywhere and is misleading. (Sharing is opt-in by sending a link; that's the privacy model.)
6. Clean up stale localStorage keys `ppp-auth` / `ppp-auth-users` on boot (one-line migration).

## Phase 2 — Fix sharing (currently broken cross-device)

The core "share with one link" promise is broken for saved builds: `useBuildShare.getShareUrl()` returns `/build/:id` when the build has an id, and `SharedBuildPage` resolves that id from the *viewer's* localStorage garage — so any recipient sees "Build not found". Same bug in `BuildCard.handleShare` (garage share button). Only the unsaved-build path (`/build/shared?b=<base64>`) actually works cross-device.

1. `src/hooks/useBuildShare.ts`: always generate the encoded-payload URL (`/build/shared?b=…`), never the id URL. Same for `src/components/garage/BuildCard.tsx`.
2. **Strip `photo` from the share payload** (and consider stripping `id`, `createdAt` noise). Photos are base64 JPEGs (~50–150 KB) and would produce URLs that break in every messenger/browser. Show a small note ("photo not included in link") if a photo exists.
3. If the payload still exceeds ~2,000 chars, warn in the toast that the link is long; consider compressing with `CompressionStream('deflate-raw')` + base64url (native, no deps) — nice-to-have.
4. **Validate the payload** in `src/pages/SharedBuildPage.tsx`: a hand-rolled `isBuild(x)` guard (components is array, bikeType is known, etc.). A valid-base64-but-wrong-shape payload currently white-screens the app (verified). Fall back to the existing "Build not found" empty state.
5. Add a top-level React error boundary in `src/App.tsx` so no route can white-screen.
6. Add a catch-all `<Route path="*">` 404 page — unknown URLs currently render an empty shell.
7. **Vercel SPA fallback**: there is no `vercel.json`/`vercel.ts` in the repo. Verify deep links (`/build/shared?b=…`, `/garage`) on the production deployment; if they 404, add a rewrite of all paths to `/index.html`.

## Phase 3 — File save/open (the "pick up where you left off" flow)

Export exists (`src/hooks/useBuildExport.ts`: txt/csv/json) but there is no import anywhere.

1. **Import build**: "Open build file…" button on Garage and Builder pages — `<input type="file" accept="application/json">`, parse, run the same `isBuild` validation from Phase 2, then load into the builder (and/or save to garage). Round-trips the existing JSON export.
2. **Full backup/restore**: "Export garage" (all builds + parts bin as one JSON file) and "Restore" on the Garage page. This is the real safety net for localStorage data.
3. Export fixes while in that file:
   - Sanitize download filenames (`build.name.replace(/[\/\\:*?"<>|]/g, '-')`).
   - Escape `"` in CSV cells (`c.replaceAll('"', '""')`) — custom part names currently corrupt the CSV.
   - Use human labels from `getCategoriesForBikeType()` instead of raw ids (`bottomBracket`) in txt/csv exports (PRD forbids technical identifiers in user-facing output).
   - Text export prints a total that includes additional items but doesn't list them — list extras too.

## Phase 4 — Data-integrity edge cases

1. **localStorage quota**: photos are stored base64 in both `ppp-current-build` and `ppp-garage`. A handful of saved builds with photos can exceed the ~5 MB quota; zustand/persist fails silently while the UI shows "Build saved!". Wrap saves (garageStore or a custom persist `storage`) so QuotaExceeded surfaces an error toast ("Storage full — remove photos or export builds"). Consider tightening `compressImage` defaults (`src/utils/imageUtils.ts`) to maxWidth 500 / quality 0.6, and validating file type/size before reading.
2. **"New Build" doesn't reset**: Garage's "+ New Build" just links to `/build`, which shows the old in-progress build; `resetBuild()` exists in `src/store/buildStore.ts` but nothing calls it. Add a "New build" action (Builder header and Garage) with a confirm if the current build has parts.
3. **Load Build clobbers unsaved work**: `BuildCard.handleLoad` overwrites the current build silently. If the current build has parts and no id (never saved), confirm first.
4. **Undo on remove**: toast says "Part removed" with no undo (PRD promised undo). Keep the removed slot in a ref and add an Undo action to the toast.
5. **Duplicate** (`BuildCard`) should load the copy into the builder and navigate there, per PRD.
6. Empty part catalogs: `sprocket` (Track/BMX) and `rearShock` (MTB) have no entries in `src/data/parts/` — the modal shows only "No parts found" for a stock category. Either add seed data for those categories or have the modal open with the custom-part form expanded and a friendlier message.
7. Custom parts vanish when removed from a slot. Persist them (new small zustand store, `ppp-custom-parts`) and merge into `getPartsByCategory()` results so they're re-selectable — this is also what the PRD specified.
8. Multi-tab: two tabs clobber each other's localStorage writes. Cheap fix: listen for the `storage` event and rehydrate stores (zustand persist exposes `persist.rehydrate()`). Low priority but cheap.

## Phase 5 — Usability & accessibility polish

1. **Keyboard/a11y (all verified in the accessibility tree)**:
   - Part cards in the selection modal are unnamed buttons — give them accessible names (`aria-label` = brand + name + price) in `src/components/parts/PartCard.tsx`.
   - Builder rows are clickable `<tr onClick>` only — not focusable. Keep the row click but make the part-name cell content a real button, or add `tabIndex`/`onKeyDown`.
   - Modal (`src/components/ui/Modal.tsx`) doesn't trap focus and leaves background interactive — add focus trap + `aria-modal`, return focus on close, Escape to close.
2. **Mobile parity** (`ComponentRowMobile.tsx`): status badge is display-only (can't set/change status on mobile) and there's no wheel expand control. Add a status control and the wheelset expander; verify extras section renders on mobile.
3. **Progress bar**: PRD calls for a visual progress bar; today it's just "1 of 14" text in `BuildHeader.tsx`. react95 has a `ProgressBar` component — cheap win.
4. **Landing example builds are dead UI** (`src/pages/LandingPage.tsx`): cards render but aren't clickable. Add "View build" (route to shared view via encoded payload) and "Use as starting point" (load into builder).
5. Wheelset expander is an unlabeled `▼` button with only a title tooltip — add visible affordance ("Split into hub/rim/spokes").
6. Console noise: react95 v4 + styled-components v6 leaks the `square` prop to the DOM, spamming warnings on every render. Fix with a `shouldForwardProp` in the global `StyleSheetManager` or wrap the Button usage.
7. Custom part form (`CustomPartForm.tsx`) and parts-bin AddPartForm accept negative prices — clamp to `>= 0`.
8. Build name: cap length (e.g. 80 chars) to protect layouts and filenames.

## Housekeeping

- `newshosting.dmg` (untracked, repo root) is unrelated to the project — confirm with Hudson before deleting; at minimum add `*.dmg` to `.gitignore`.
- `dist/` is committed; if Vercel builds from source, consider removing it from the repo.

## Explicitly out of scope

Compatibility checking, price tracking, community/explore, backend persistence or share-link shortening service, OAuth. If cross-device sync ever becomes a real need, revisit with a tiny KV store for share payloads first — not full auth.

## Suggested sequencing / sizing

| Phase | Size | Risk |
|---|---|---|
| 1 Remove auth | S | Low — deletion + unwiring |
| 2 Fix sharing | M | Low — highest user value |
| 3 File open/save | M | Low |
| 4 Data integrity | M | Medium (quota handling touches persist) |
| 5 Polish/a11y | M | Low |

Phases 1+2 together make the app's core promise (build → share a working link) true and are the minimum worthwhile handoff unit.
