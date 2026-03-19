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
- `src/App.tsx` — Main router/switcher. Uses a `useState` to toggle between ~20 different game/simulation views. Default view is `wss-prototype`.
- `src/components/` — General-purpose game components (MazeGame, TerrainGame, FruitCollector, FollowMeGame, GuessingGame, MultiGoalRobot, DarkGame, TagGame, RGBTerrainNavigator, RobotTrading, MonsterCards, CollaborativeDrawing, WebSocketChat, WSSPrototype, etc.)
- `src/combat/` — Combat-related simulations (Combat.tsx as sub-router, **WSSPhase0** [A Forgotten Place Phase 0], ZombiesAhh, EmptyClassroom, RogueLikeGame, WSSRogueHDraft, WSSTwo)
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