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
- `src/App.tsx`: Main router/switcher; default view is `combat` (WSS2 Phase 2). A floating button provides access to other components.
- `src/components/`: General-purpose game components.
- `src/combat/`: Combat-related simulations, including `WSSPhase3` (A Forgotten Place Phase 3 - default development target), `WSSPhase2` (stable demo), and `WSSPhase1`.
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
- **Objectives**: 6 types (ActivateSwitch, Survive, Extract, DestroyNests, Collect, Rescue); progressive HUD reveal.
- **Difficulty**: Static within maps, adaptive between maps (roguelike escalation), Charms/Lucky Items for bonuses.
- **Run Structure**: Sequential maps (e.g., Map 1 → Rift Portal → Survivor Market → Map 2) with S/A/B/C/D/F grading.
- **Camera**: Observer Grid, Survivor Cam, Free Cam, Free Zoom.
- **Visuals**: Modular sprite pieces (paper-doll, 5 layers) for humanoids.
- **AI Brains**: 5 personality types, availability-based revive, compass navigation, hybrid tick-based + event-driven decision making.
- **Loot**: Clustered in buildings, random scatter, pre-placed + enemy drops, no rarity tiers, difficulty-driven quality, themed containers, respawning.

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