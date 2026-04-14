# replit.md

## Overview

This is an advanced AI simulation framework built as a React + TypeScript web application. The project centers around **"A Forgotten Place" (WSS2)** — a zero-player survival horror game inspired by COD Cold War Zombies: Onslaught. AI-controlled survivors navigate procedurally generated biomes, fight zombie hordes and hostile humans, complete objectives to unseal rift portals, and attempt evacuation across sequential maps. The project also includes the original **Wilderness Survival System (WSS1)** prototype and multiple interactive game/simulation modules used as building blocks: zombie combat, roguelike dungeons, pathfinding, collaborative drawing, trading simulations, and more. This is an academic project for CS 4800 (Software Engineering), demonstrating OOP principles, AI decision-making, and real-time systems.

## WSS2 "A Forgotten Place" — Design Status

### Locked Design Decisions (37 total)
- **Movement**: Hybrid — grid-based world, smooth entity movement on top, AI pathfinds on grid
- **Combat**: Real-time 60 ticks/sec, 3 weapon classes (fists/melee/guns), noise mechanic, armor system, simultaneous group combat, cover system
- **Spawners**: Corruption Nests = enemy spawners, Rift Portals = exit goals, Placeables = survivor-built
- **Objectives**: 6 types (ActivateSwitch, Survive, Extract, DestroyNests, Collect, Rescue), progressive HUD reveal
- **Difficulty**: Static within maps, adaptive between maps (roguelike escalation), Charms/Lucky Items
- **Run Structure**: Map 1 → Rift Portal → Survivor Market → Map 2 → ... with S/A/B/C/D/F grading
- **Camera**: Observer Grid (all survivors), Survivor Cam, Free Cam, Free Zoom
- **Visuals**: Modular sprite pieces (paper-doll, 5 layers) for humanoids
- **Faction System**: PLAYER_TEAM / HOSTILE / NEUTRAL
- **AI Brains**: 5 personality types, availability-based revive, compass navigation
- **Entity Size**: Sub-tile (radius 0.3–0.4 tiles, float positions, multiple per tile)
- **Buildings**: Stamp Library + Placement Rules + Dressing Pass (12-20 templates, biome-weighted)
- **Loot Distribution**: Clustered in buildings + random scatter (pre-game slider), pre-placed + enemy drops, no rarity tiers, difficulty-driven quality
- **Loot Bias Model**: C+A hybrid — difficulty-driven quality base + mild distance-from-spawn nudge (distance modifier removable for other game modes)
- **Loot Density**: More indoors than outdoors; containers + scattered inside buildings, sparser outside
- **Themed Containers**: Building type determines loot category (hospital=medical, military=weapons/ammo, etc.)
- **Enemy Drops**: Weapons, ammo, armor, food/water, currency, clothes, backpacks (1 backpack per survivor)
- **Loot Respawn**: ON by default (togglable); container loot one-time, respawns as new ground items/containers
- **Friendly Fire**: ON — full damage to allies
- **Brain Model**: Hybrid tick-based + event-driven, every tick default (fallback every 5), self-status priority, radio for team awareness
- **Melee Durability**: Melee weapons break after durability depletes
- **Reload Mechanics**: Guns have reload times, can move during reload, interrupt on damage/weapon switch

### Design Documents
All design docs live in `wss(full game ideas)/`:
- `ROADMAP.md` — Phased development plan (Phase 0-8)
- `systems/combat.md` — Combat engine, weapons, armor, damage formulas
- `systems/spawners-and-enemies.md` — Corruption Nests, Rift Portals, enemy roster
- `systems/ai-brains.md` — Brain interface, personality types, decision trees
- `systems/fog-and-vision.md` — Shared team fog, vision formula, phantom markers
- `systems/map-generation.md` — Procedural terrain, structures, entity placement
- `systems/object-model.md` — OOP class hierarchy (Entity/Actor/Survivor/Zombie/etc.)
- `systems/resources-and-economy.md` — Gold, trading, stamina, market system
- `systems/core-loop.md` — Main game loop architecture
- `systems/day-night-cycle.md` — Day/night mechanics
- `systems/win-conditions.md` — Portal evacuation, scoring, grading
- `systems/god-system.md` — God System (LLM-Assisted Asynchronous Director) — UNSTABLE, post-Phase 4

## Current Build Status (as of April 2026)

### What Is Built (Phase 2 — Stable Demo)
- **WSSPhase2.tsx** — the stable, demo-ready build. This is what was presented for Sprint 2.
- **WSSPhase3.tsx** — currently **code-identical** to Phase 2. This is the workspace file for Phase 3 development. All new features go here.
- Features complete in Phase 2:
  - Voronoi biome generation with seeded PRNG, fog of war (unexplored/seen/visible)
  - 5 AI brain types: Balanced (pistol), Aggressive (shotgun), Cautious (knife), Survivalist (bat), Money-Driven (rifle)
  - Full combat engine: melee + ranged, armor, reload, noise mechanic, friendly fire
  - Corruption Nests spawning zombies, zombie aggro radius (9 tiles)
  - 3 sequential objectives (ActivateSwitch) with compass arrows, hold-to-activate
  - Rift Portal evacuation with pulse animation
  - Win/loss grading (S/A/B/C/D/F)
  - Finite ammo, loot spawning/scavenging, nest destruction, damage log
  - Observer UI: Observer Grid, Survivor Cam, Free Cam, zoom controls
  - Settings panel: seed input, map size (30/40/60), speed (1x-8x)

### Key Game Constants (Phase 2)
| Constant | Value | Notes |
|---|---|---|
| SURVIVOR_BASE_HP | 80 | Reduced from 100 for higher tension |
| ZOMBIE_DAMAGE | 20 | High base, offset by armor |
| VISION_RADIUS | 6 | Tiles, shared team fog |
| ZOMBIE_ALERT | 9 | Detection radius in tiles |
| PER_NEST_MAX | 4 | Max zombies per nest |
| NEST_COOLDOWN | 320 | Ticks between spawns |
| HOLD_REQUIRED | 60 | Ticks to activate a switch |
| EVAC_RADIUS | 1.6 | Tiles, portal evacuation range |
| MAX_LOG | 120 | Damage log entries |
| Loot respawn | 500 ticks | Ground item respawn interval |
| Armor values | cautious:8, aggressive:5, survivalist:6, others:3 | Per brain type |
| Zombie speed | 0.028 | Tiles per tick |

### What Is NOT Built Yet (Phase 3+ Targets)
From `wss(full game ideas)/ROADMAP.md` and system design docs:

**Phase 3 — Day/Night Cycle + Survivor Market:**
- Day/Night cycle: vision drops to 70% at night, enemies more aggressive, sky color shifts, HUD clock, "Sunrise Buy Window"
- Survivor Market: safe zone between maps (Map 1 → Portal → Market → Map 2), buy/sell gear with gold, Neutral Faction NPCs
- Charms/Lucky Items: passive bonuses with 3 scopes (Personal, Team, World)
- AI Trading: agents evaluate trade offers based on personality and current needs

**Phase 4 — God System (Director AI):**
- LLM-assisted asynchronous game director (modeled after Left 4 Dead / RimWorld)
- Monitors runs and adjusts difficulty in real time
- Marked UNSTABLE in design docs — post-Phase 4

**Locked decisions not yet implemented in code:**
- Smooth sub-tile entity movement (currently grid-snapped)
- Building Stamp Library (12-20 templates, biome-weighted dressing)
- Humanoid combat unification (enemies = hostile survivors with different brains)
- Help/Revive system (availability-based, not personality-based)
- Additional objective types beyond ActivateSwitch (Survive, Extract, DestroyNests, Collect, Rescue)
- Themed loot containers (hospital=medical, military=weapons, etc.)
- Enemy drops (weapons, ammo, armor, food, currency, clothes, backpacks)
- Paper-doll modular sprite system (5 layers)

### Development Workflow
- Phase 2 file (`WSSPhase2.tsx`) is frozen — do not modify unless fixing critical bugs
- Phase 3 file (`WSSPhase3.tsx`) is the active development workspace
- `Combat.tsx` is the sub-router inside `src/combat/`; its default view points to WSSPhase3
- Always test with seed 12345 on a 30x30 map as the golden regression test
- Design docs in `wss(full game ideas)/systems/` are the source of truth for feature specs

### Notion Reference (for cross-tool context)
- **Source of Truth**: `30a0e51f-71de-8149-af72-cd8ce49b0fda`
- **Progress Log**: `3280e51f-71de-81ef-89f0-c3f37564110f`
- **ROADMAP**: `30c0e51f-71de-811f-ba7e-f7dc24251b6a`
- **WSS Presentation Page**: `5202894b96414b94938d0d68a17bb166`
- **Speaker Notes**: `33c0e51f-71de-8016-a41c-c29589903adb`

### Known Issues / Gotchas
- Port conflicts: if the app won't start, run `pkill -f "node server.js"` then restart the "Run" workflow
- WSSPhase2.tsx and WSSPhase3.tsx are each ~2,600+ lines — monolithic by design (self-contained simulation)
- The `arrow` workflow (`node server.js`) is an alternative entry point; the primary workflow is `Run` (`npm run dev`)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (dev server on port 5174, proxied through Express)
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: lucide-react for all iconography
- **State Management**: React useState/useEffect hooks — no external state library
- **Component Structure**: Each game/simulation is a self-contained component with its own interfaces, state, and logic. There is no shared global state store.

### Application Layout
- `src/App.tsx` — Main router/switcher. Uses a `useState` to toggle between ~20 different game/simulation views. **Default view is `combat`** (A Forgotten Place / WSS2 Phase 2 — the landing page). WSS1 prototype is accessible via Other Apps hub. A small floating "☰ WSS Components" button (z-[200]) overlays the full-screen game to escape to the component hub.
- `src/components/` — General-purpose game components (MazeGame, TerrainGame, FruitCollector, FollowMeGame, GuessingGame, MultiGoalRobot, DarkGame, TagGame, RGBTerrainNavigator, RobotTrading, MonsterCards, CollaborativeDrawing, WebSocketChat, WSSPrototype, etc.)
- `src/combat/` — Combat-related simulations (Combat.tsx as sub-router, **WSSPhase3** [A Forgotten Place Phase 3 — default], WSSPhase2, WSSPhase1, WSSPhase0, ZombiesAhh, EmptyClassroom, RogueLikeGame, WSSRogueHDraft, WSSTwo)
- `src/replit/` — Additional simulation scenes (ReplitScene as sub-router, Priority, WeightedDecisions, Pathfinder, BeeHiveSimulation, AIEcosystem, Spawner, MultiValuedItemCollector, Scene7, Scene8)
- `WSS_Submission/` — Duplicate copies of key source files bundled for academic submission

### Backend Architecture
- **Server**: Express 5 running on port 5000 (configurable via `PORT` env var)
- **Entry Point**: `server.js` (ESM module) — serves as both the Express server and spawns a Vite dev server as a child process in development
- **WebSocket**: `ws` library providing real-time communication at the `/ws` path on the same HTTP server
- **WebSocket Features**: Client tracking with random IDs and colors, broadcast messaging, used for collaborative drawing and chat features
- **No Database**: All state is in-memory on the client or server; there is no persistent data storage
- **No Authentication**: No user auth system exists

### Key Design Decisions

1. **Monolithic component pattern**: Each simulation (WSS, roguelike, zombie combat, etc.) is a single large React component (WSSTwo.tsx is 2,661+ lines). This keeps each simulation self-contained but makes individual files very large.
   - *Rationale*: Simplicity for academic project; each component can run independently
   - *Tradeoff*: Hard to maintain/refactor large single-file components

2. **TypeScript interfaces over classes**: The project uses TypeScript interfaces and types extensively to define game entities (Cell, Player, Enemy, Trader, Item, etc.) rather than ES6 classes.
   - *Rationale*: Works naturally with React's functional component pattern and state hooks
   
3. **No routing library**: Navigation between views is handled by conditional rendering in App.tsx based on state, not react-router.
   - *Rationale*: Single-page app where all views are top-level alternatives, no need for URL-based routing

4. **Combined server approach**: `server.js` runs both Express and spawns Vite dev server, proxying requests in development.
   - *Rationale*: Allows WebSocket server and Vite to coexist on one exposed port in Replit

5. **Graceful WebSocket degradation**: Components like WebSocketChat and CollaborativeDrawing fall back to "demo mode" with mock data after failed connection attempts.

### Running the Application
- `npm run dev` or `npm start` — Runs `server.js` which starts Express on port 5000 and spawns Vite dev server on port 5174
- `npm run build` — Builds the frontend with Vite
- The Vite config (`vite.config.ts`) sets the dev server to `0.0.0.0:5173` but `server.js` overrides this to port 5174

## External Dependencies

### NPM Dependencies (Runtime)
- **react / react-dom** (v18.3) — UI framework
- **express** (v5.1) — HTTP server
- **ws** (v8.18) — WebSocket server for real-time features
- **http-proxy-middleware** (v3.0) — Proxies Vite dev server requests through Express in development
- **lucide-react** (v0.344) — Icon library

### NPM Dependencies (Dev)
- **vite** (v5.4) — Build tool and dev server
- **@vitejs/plugin-react** — React support for Vite
- **typescript** (v5.5) — Type checking
- **tailwindcss** (v3.4) / **postcss** / **autoprefixer** — CSS toolchain
- **eslint** with typescript-eslint, react-hooks, react-refresh plugins — Linting

### External Services
- **None** — No external APIs, databases, or third-party services are used. All data is generated procedurally on the client or held in-memory on the server.