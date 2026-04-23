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
- **HUD (Phase 3)**: Top bar with round counter (R:N), live score, escalation level indicator, objective type icons. Right overlay with active objective description + progress, portal status, world stats (kills, score). Sidebar with detailed objective cards with progress bars, survivor cards with armor display.

### Upcoming Work (DO NOT build until Casey requests)
- **Zombie AI Brainstorm**: Casey added a ZOMBIE AI BRAINSTORM section to the Notion Source of Truth page (page ID: 30a0e51f-71de-8149-af72-cd8ce49b0fda). Covers smarter zombie behavior — line of sight, wandering, losing interest, etc. When Casey asks to work on this, pull the full spec from Notion first and build incrementally in a **sandbox file** (not WSSPhase3.tsx). Stability over features — Phase 3 is stable and should not be destabilized by experimental work.

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