# Build & Deployment Instructions — WSS2 *A Forgotten Place*

**Document type:** Build & Deployment Instructions (DEV deliverable)

This project ships as a pnpm workspace monorepo. The grader has three options:

1. **Just play it** — open the live URL, no install needed.
2. **Run it locally** — clone the repo and run one command.
3. **Run it on Replit** — fork the workspace and click "Run".

---

## Option 1 — Play the live deployment (zero setup)

Open in any modern web browser:

> **https://wss-revised.replit.app/**

The simulation runs fully client-side. Progress (scrap, perks, gear) saves to your browser's `localStorage`, scoped to the deployment URL. Clearing site data resets the meta progression.

**Recommended browser:** Chrome / Edge / Firefox / Safari (latest). Mobile browsers work but the layout is tuned for desktop ≥ 1024px wide.

---

## Option 2 — Run locally

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 24 | Runtime for Vite dev server |
| pnpm | ≥ 9 | Workspace package manager (required — `npm` won't resolve workspace packages correctly) |
| Git | any | Clone the repo |

Install pnpm globally if you don't have it:

```bash
npm install -g pnpm@latest
```

### Build & run

```bash
# 1. Clone
git clone https://github.com/CaseyWongWc/testing.git
cd testing
git checkout wss2

# 2. Install (installs all workspace packages in one pass)
pnpm install

# 3. Type-check everything (optional but recommended)
pnpm run typecheck

# 4. Run the game
pnpm --filter @workspace/a-forgotten-place run dev
```

The dev server prints the URL it's listening on (typically `http://localhost:5173/` or whichever port is free). Open it in a browser.

### Optional — run other artifacts

```bash
# Slide deck (presentation)
pnpm --filter @workspace/wss2-deck run dev

# API server stub (not required for gameplay)
pnpm --filter @workspace/api-server run dev
```

### Build a production bundle

```bash
pnpm --filter @workspace/a-forgotten-place run build
# Outputs static assets to artifacts/a-forgotten-place/dist/
# Serve with any static file server, e.g.:
npx serve artifacts/a-forgotten-place/dist
```

---

## Option 3 — Run on Replit (no local setup)

1. Open the Replit workspace link (provided in submission notes).
2. Click **Fork** to copy it into your own account.
3. Click **Run** — Replit auto-installs dependencies and starts every workflow.
4. Use the preview pane's artifact dropdown to switch between *A Forgotten Place* (the game) and *A Forgotten Place — Slide Deck*.

The four pre-configured workflows are:

| Workflow | Command | Purpose |
|---|---|---|
| `artifacts/a-forgotten-place: web` | `pnpm --filter @workspace/a-forgotten-place run dev` | The game |
| `artifacts/wss2-deck: web` | `pnpm --filter @workspace/wss2-deck run dev` | Presentation deck |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | Reserved API |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | Internal tool (ignore) |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pnpm: command not found` | pnpm not installed | `npm i -g pnpm` |
| Port already in use | Another dev server is running | Stop it, or set `PORT=5174 pnpm --filter @workspace/a-forgotten-place run dev` |
| Game starts but my old scrap is gone | Different browser / cleared site data | Expected — `localStorage` is per-origin and per-browser |
| Console error about a missing formula assertion | Source has drifted from `computeNightBonus` self-test | This is by design; the assertion will name the file and expected value. Revert the offending change. |

---

## Verifying the install

After running `pnpm install`, you should see roughly:

```
Done in <time>
+ Packages: <N> reused, <M> downloaded
```

Then `pnpm run typecheck` should print nothing but green checks across all workspace packages. If type-check passes, the source builds.
