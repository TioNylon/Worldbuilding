# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build   # esbuild src/app.jsx -> public/app.js (minified, one-shot)
npm run dev     # same, but --watch and serves public/ (use with `wrangler dev` below, not alone)
npx wrangler dev --local --port 8787   # local Worker + D1 + KV, reads .dev.vars for secrets
```

There is no lint or test suite in this repo. `.dev.vars` (gitignored) holds local-only secrets — currently `ACCESS_KEY` and `GUEST_ACCESS_KEY` — mirroring the production secrets described below.

### Deploying

The Cloudflare Worker (`worldbuildingnylon`) is Git-connected: **pushing/merging to `main` on GitHub triggers an automatic deploy.** There is no manual `wrangler deploy` step in normal use.

Standing workflow for changes: create a feature branch off `main` *before* editing anything, `npm run build`, verify locally via `wrangler dev`, commit, push, open a PR. **Do not merge to `main` without the user explicitly asking for it** — merging ships straight to production immediately.

Secrets (`ACCESS_KEY`, `GUEST_ACCESS_KEY`) live only in the Cloudflare dashboard (Worker → Settings → Variables and Secrets), or can be set via `wrangler secret put <NAME>` / `wrangler versions secret put <NAME>`. Note: `wrangler versions secret put` on an *existing* secret creates a new Worker version but does **not** put it live — it needs `wrangler versions deploy <version-id>@100` afterward, or the next git-triggered deploy, to actually take effect on production traffic.

## Architecture

**Two files matter for behavior; everything else is generated or static:**
- `worker.js` — the entire backend. Routes `/api/storage/<key>` (GET/PUT/DELETE) to either the `IMAGES` KV namespace (keys starting `map-image:`/`cover-image:`) or the D1 table `kv_store(key, value, updated_at)` (everything else — one JSON blob per key, no relational schema). Also authenticates every request and serves `public/` as static assets otherwise.
- `src/app.jsx` — the entire frontend (~8800 lines, single file), built by esbuild into `public/app.js`. `public/index.html` loads it as a native ES module and resolves `react`, `react-dom/client`, `react/jsx-runtime`, and `lucide-react` via an `importmap` pointing at esm.sh — esbuild does **not** bundle those (`--external:` flags in the build script), it only bundles/minifies `app.jsx` itself.

`app.jsx` is organized into ~60 labeled sections, each marked with a comment divider:
```js
/* ---------- SECTION NAME ---------- */
```
Grep for these to navigate — they group by role: data/config (entry type definitions, seed data, storage helpers) near the top, one React component per "block" type (the ~25 `BLOCK: ...` sections — stats, dialogue, threat level, etc.), then one component per full-screen view (Sidebar, Dashboard, the various "Libro" book views, Brain view), then styles, then login/bootstrap (`Root`) at the very end.

### Auth and multi-tenancy

Every `/api/storage/<key>` request needs `Authorization: Bearer <username>:<password>`. `worker.js`'s `resolveProfile()` matches that against two hardcoded usernames (`admin`, `visita`) and their respective secrets (`ACCESS_KEY`, `GUEST_ACCESS_KEY`), returning a storage **scope** — `""` for admin, `"guest:"` for visita. The scope is prepended to every storage key server-side, so the visita profile reads/writes an entirely separate namespace (its own `guest:world-tree`, `guest:world-projects`, `guest:cover-image:*`, etc.) and can never reach admin's real data. On the frontend, the credential is kept only in an in-memory module variable (`sessionToken` in `app.jsx`, not `localStorage`), so a page reload always re-prompts for login.

### World data model

A "project" (`PROJECTS_KEY` = `world-projects`, listing `{id, name}` + `activeId`) is a full copy of the world: its own node tree, type templates, skin, dashboard, etc., each stored under a key derived by `treeKeyFor(pid)` / `templatesKeyFor(pid)` / etc. — the default project uses bare keys (`world-tree`), any other project prefixes with `p:<id>:`. Switching projects in the UI just swaps which key set is read/written.

Within a project, the entire world is one flat array of **nodes** (`{id, parentId, order, type, name, content, content2, category, blocks}`) stored as a single JSON blob. `type` is structural (`folder`/`page`/`map`/`timeline`/`board`), `category` (only on `type: "page"`) is one of ~20 keys defined in `ENTRY_TYPES` (Personaje, Objeto, Lugar, Beat, Escena, ...), each with a label/icon/color. `CATEGORY_EXTRA_TOOL` maps a category to which block types can be added to it; `makeBlock(type)` is the factory for a block's default shape; `getPageBlocks(node)` reads `node.blocks` or derives a legacy fallback from `content`/`content2` for old nodes that predate the block system.

Cross-linking works two ways: structured references (a field storing another node's `id`, e.g. `beatInfo.chapterId`, resolved via `nodes.find`), and free-text `[[Name]]` wiki-links resolved by exact case-insensitive name match at render time. Renaming a node (`renameNode`) rewrites every `[[OldName]]` occurrence across all nodes' known text fields to keep links intact — this only fires on renames done *through* `renameNode`; links broken by a rename from before that logic existed stay broken until manually fixed.

### Page editor modes

`CanvasEditor` has two distinct layout engines sharing the same block components:
- `mode === "entry"` (real content) always renders `BookPageEditor` — paginated, one block per page, no manual positioning.
- `mode === "template"` (the "Formatos por tipo" designer, under Herramientas) keeps the original free-canvas system — blocks are manually dragged/resized (`x/y/w/h`) to define a category's default layout, which new entries of that category inherit.

### Auxiliary tools

Herramientas (`ToolsView` / `TOOLS_SECTIONS`) can also host fully standalone HTML tools that don't need React integration: drop the file in `public/tools/`, add a `TOOLS_SECTIONS` entry, and render it via `<iframe src="/tools/<file>.html">` in `ToolsView`'s section switch. These tools keep their own independent state/UI and aren't touched by the rest of the app.
