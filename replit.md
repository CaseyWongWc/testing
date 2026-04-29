# replit.md

## Overview

This project is an advanced AI simulation framework developed as a React + TypeScript web application, primarily featuring "A Forgotten Place" (WSS2). This is a zero-player survival horror game inspired by COD Cold War Zombies: Onslaught, where AI-controlled survivors navigate procedurally generated biomes, combat zombie hordes and hostile humans, complete objectives to unseal rift portals, and attempt evacuation across sequential maps. The framework also incorporates the original Wilderness Survival System (WSS1) prototype and various interactive game/simulation modules demonstrating OOP principles, AI decision-making, and real-time systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (dev server on port 5174, proxied through Express)
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: lucide-react
- **State Management**: React useState/useEffect hooks

### Application Layout
- `src/App.tsx`: Main router/switcher; default view is `combat` (WSS2 Phase 3). A floating button provides access to other components.
- `src/components/`: General-purpose game components.
- `src/combat/`: Combat-related simulations. `WSSPhase3` is the active default (Phase 3 with expanded objectives, grading, escalation). `WSSPhase2` is the stable Phase 2 backup. `WSSPhase1` and `WSSPhase0` are earlier iterations.
- `src/combat/Combat.tsx`: Scene switcher for combat views; defaults to `wssphase3`.
- `src/replit/`: Additional simulation scenes (e.g., Pathfinder, BeeHiveSimulation).

### Backend Architecture
- **Server**: Express 5 on port 5000 (`server.js`)
- **WebSocket**: `ws` library for real-time communication at `/ws`
- **Data Storage**: All state is in-memory on client or server; no persistent database.
- **Authentication**: None.

### Key Design Decisions
1.  **Monolithic component pattern**: Each simulation is a single, large React component to maintain self-containment, simplifying academic project structure but increasing file size.
2.  **TypeScript interfaces over classes**: Extensive use of TypeScript interfaces and types for entity definitions aligns with React's functional component pattern.
3.  **No routing library**: Navigation between views is handled by conditional rendering in `App.tsx` for a single-page application.
4.  **Combined server approach**: `server.js` integrates Express and spawns the Vite dev server, allowing WebSocket and Vite to coexist on one exposed port.
5.  **Graceful WebSocket degradation**: Components fall back to demo mode with mock data upon failed WebSocket connection.

### Core Game Design (WSS2 "A Forgotten Place")
- **Movement**: Hybrid grid-based world with smooth entity movement and AI pathfinding on grid.
- **Combat**: Real-time 60 ticks/sec, 3 weapon classes, noise mechanic, armor, simultaneous group combat, cover system, friendly fire enabled.
- **Spawners**: Corruption Nests (enemy spawners), Rift Portals (exit goals), Placeables (survivor-built).
- **Objectives (Phase 3)**: 5 types randomly assigned per map:
  - **ActivateSwitch**: Hold position near a switch to activate it.
  - **DestroyNests**: Destroy N corruption nests (only generated when nestCount >= 2).
  - **Survive**: Survive for N ticks (progress only counts while active).
  - **Collect**: Collect N supply items (counted from activation).
  - **Rescue**: Rescue N stranded survivors (SOS beacons on map, hold position to rescue).
  - Extract is implicit (portal unseals after all objectives complete; evacuate to win).
  - Each objective tracks progress independently from its activation tick.
- **Grading (Phase 3)**: S/A/B/C/D/F based on evacuation rate, survival rate, objectives completed, kills, and time efficiency.
- **Escalation (Phase 3)**: Every 400 ticks, enemies escalate — zombie HP +8%, damage +5%, nest spawn speed +6% per level. New zombies spawn at higher tiers with increased stats and armor.
- **Difficulty**: Static within maps, adaptive between maps (roguelike escalation), Charms/Lucky Items for bonuses (planned).
- **Run Structure**: Sequential maps (e.g., Map 1 → Rift Portal → Survivor Market → Map 2) with S/A/B/C/D/F grading.
- **Camera**: Observer Grid, Survivor Cam, Free Cam, Free Zoom.
- **AI Brains**: 5 personality types (balanced, aggressive, cautious, survivalist, money), compass navigation with distance readout, hybrid tick-based + event-driven decision making. New AI states: rescuing (for Rescue objectives), scavenging priority for Collect objectives.
- **Loot (Phase 3)**: 4 types — health packs, ammo crates, armor plates, stimpacks. Clustered near structures, random scatter, nest drops. Respawning every 400 ticks when below cap.
- **HUD (Phase 3)**: Top bar with round counter (R:N), live score, escalation level indicator, objective type icons. Right overlay with active objective description + progress, portal status, world stats (kills, score). Sidebar with detailed objective cards with progress bars, survivor cards with armor display. Also includes a DAY/NIGHT badge with ticks until the next phase flip.

### Recently Shipped (production, in `src/combat/WSSPhase3.tsx`)
- **Smart Zombies (Task #1)**: Three-layer zombie AI — wandering at idle, line-of-sight chase when survivors are visible, and lose-interest behavior when the target is no longer seen for N ticks. Sandbox file `src/combat/ZombieAISandbox.tsx` is registered in `Combat.tsx` for tuning the layers in isolation.
- **Survivor Market & Currency v1 (Task #2)**: Between-run shop wrapping Phase 3. Lives in `src/combat/WSS2MetaShell.tsx`. WSSPhase3 takes two optional props (`loadout`, `onRunComplete`); the shell threads loadout in and collects the run result. Scrap formula: `floor(score/10) + kills + evacuated*15 + gradeBonus` (S=50, A=30, B=15, C=5, D=0, F=0). 4-item catalog (Extra Survivor 60, Pistol Cache 40, Shotgun Cache 100, Medkit 25) with caps (2/2/1/3) clamped on purchase AND on load-from-localStorage. localStorage key `wss2_meta_v1`. Combat.tsx routes "Phase 3 + Market" → `WSS2MetaShell`; "Phase 3 (no meta)" → bare WSSPhase3 for sandbox testing.
- **Day/Night Cycle (Task #3)**: Fixed-tick cycle — `DAY_LENGTH=600`, `NIGHT_LENGTH=400`, short `PHASE_FADE` ramp at dawn/dusk for smooth transitions. Zombies use a night alert multiplier (up to 1.6×) on both LOS detection and noise hearing radius; the multiplier scales with the smooth `nightFactor`. A tinted full-canvas overlay (`rgba(20,30,80, up to 0.5)`) darkens and cools the scene at night. Combat log fires on nightfall and dawn. No new state on Zombie — `alertRadius` stays as the base value, the night multiplier is applied per-tick.
- **Survivor Light Radius at Night (Task #9)**: Each living, non-evacuated survivor projects a soft 7-tile circular light at night that "punches through" the night overlay. Implemented with a cached module-level offscreen canvas (`getNightOverlayCanvas`) using `destination-out` composite + radial gradient, so survivor sprites underneath are NOT erased. Rendering-only — does NOT change zombie LOS, hearing, alert radius, or any AI math. Scales smoothly with `nightFactor` so it fades in at dusk and out at dawn alongside the overlay.
- **Night Scrap Bonus (Task #10)**: Kills (zombie + nest) and evacuations performed while `nightFactor(state.tick) > 0.5` are tallied into `state.nightKills` / `state.nightEvacuations`. `computeRunResult` adds `nightBonus = nightKills*1 + nightEvacuations*5` to `scrapEarned` and exposes it via `RunResult.nightBonus` + `scrapBreakdown.nightBonus`. WSS2MetaShell results screen renders a conditional "Night bonus" row when `nightBonus > 0`. No AI/zombie behavior changes — pure economy reward to encourage night risk.

### Active Drafts (NOT building until Casey activates)
- **Task #8 — Apply Strategy/State pattern to a future Phase's AI**: Draft plan at `.local/tasks/strategy-pattern-future-phase.md`. Mirrors the In-Class Exercise 7 sandbox into the active phase if/when Casey decides. Do NOT auto-build.

### Sandbox Experiments
- **Zombie Variants sandbox** (`src/combat/ZombieAISandbox.tsx`) — original prototype for Walker/Runner/Brute. Now also LIVE in Phase 3 (see Shipped log). The sandbox stays as the tuning playground — change variant stats here first, then port deltas into Phase 3's `VARIANT_STATS`.

### Class Deliverables (CS 4800)
- **In-Class Exercise 8** (`attached_assets/ICE8_TestCaseSpec.md`) — Test Case Specification Document + Traceability Matrix for the front-end team. 8 IEEE-829-style test cases mapped to 8 front-end use cases (Market, Perks, Run Start, AI Combat, Night Bonus, Run Results, Reset, Sim Picker). Document only — no code changes. Casey emails this to the instructor.

### Live in Phase 3
- **Zombie Variants — Walker / Runner / Brute (LIVE)**: Phase 3's Zombie type now has a `variant` field. `VARIANT_STATS` table in `src/combat/WSSPhase3.tsx` drives speed (×0.55–×1.55), alert radius (7–12), chase persistence, patrol speed, body size, accent ring color, and HP multiplier (×0.75–×1.60). Each zombie renders with a colored outer ring on the canvas (white = Walker, yellow = Runner, magenta = Brute). Initial spawns are mostly Walkers with a small chance of Runners/Brutes scaling with escalation. Nest spawns use tier-weighted buckets (Tier 0: 70/20/10, Tier 1: 45/35/20, Tier 2+: 35/30/35 walker/runner/brute). Phase 2 is untouched.
- **Live Night-Bonus HUD pill (LIVE)**: Top toolbar in Phase 3 now shows a small indigo "🌙+N (Xk·Ye)" pill the moment the player earns night-bonus scrap (kills or evacs while `nightFactor(tick) > 0.5`). The number reflects the player's Scrap-Magnet perk multiplier in real time. Pill pulses while it's currently night, sits static during day. Hidden when nothing has been earned yet.
- **Night-bonus formula locked in**: The night-bonus math is now extracted into `export function computeNightBonus(nightKills, nightEvacuations, scrapMultiplier)` — a single source of truth used by both the run-end breakdown and the live HUD pill. A dev-only self-test runs at module load (gated by `import.meta.env.DEV`) with seven explicit cases (zero, kills only, evacs only, mixed, multiplier scaling, negative-clamp, zero-multiplier). If anyone changes the formula without updating the cases, the dev console throws on the next reload.

### Upcoming Work (DO NOT build until Casey requests)
- **Zombie AI Brainstorm**: Notion source-of-truth page (30a0e51f-71de-8149-af72-cd8ce49b0fda) has a ZOMBIE AI BRAINSTORM section. Baseline behaviors (wandering, LOS detection, lose interest, investigate noise) are already shipped in Phase 3. The variants prototype above is the next step toward the brainstorm's "different zombie types" idea — but it lives in the sandbox and has not been promoted to Phase 3.

### In-Class Exercise 7 — Design Pattern (Strategy)
- For CS 4800 In-Class Exercise 7, a Strategy-pattern brain dispatcher was added to **`src/combat/WSSTwo.tsx`** (legacy file). It introduces a `BrainDecisionStrategy` interface and a `brainStrategies` map keyed by `BrainType`, replacing direct branching with a strategy lookup. Each strategy delegates to the existing `calculateBrainMoveByType(brain)` function, so behavior is unchanged.
- This work is **kept as its own sandbox fork** in WSSTwo.tsx — it does NOT affect Phase 2, Phase 3, or the WSS2 Market loop. Phase 3 remains the production path.
- If we ever want to mirror the same idea into Phase 3 (e.g., a strategy map keyed by zombie state: wandering / chasing / lost-interest), open it as a separate task — do not piggyback on unrelated work.

## External Dependencies

### NPM Dependencies (Runtime)
- **react / react-dom** (v18.3)
- **express** (v5.1)
- **ws** (v8.18)
- **http-proxy-middleware** (v3.0)
- **lucide-react** (v0.344)

### NPM Dependencies (Dev)
- **vite** (v5.4)
- **@vitejs/plugin-react**
- **typescript** (v5.5)
- **tailwindcss** (v3.4) / **postcss** / **autoprefixer**
- **eslint**

### External Services
- None. All data is procedurally generated or in-memory.