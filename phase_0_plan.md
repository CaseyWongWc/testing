# Phase 0 Plan — "A Forgotten Place" (WSS2)

> **Purpose:** This is the focused coding brief for Phase 0. Read this at the start of every coding thread. Keep `wss(full game ideas)/` as the long-term vision archive — this file is the "what to build RIGHT NOW" document.

> **Last Updated:** February 2026

---

## Goal

Build the **foundation** of the WSS2 game engine: a working game loop, entity system, grid world, and Canvas renderer. By the end of Phase 0, you should be able to:

1. Launch "A Forgotten Place" from the app menu
2. See a procedurally generated grid rendered on an HTML Canvas
3. Watch placeholder entities (colored circles) exist on the grid with float positions
4. See the game loop ticking at 60 ticks/sec with a visible tick counter
5. Pause/resume and adjust game speed with a slider

**Phase 0 is NOT:** combat, AI brains, fog of war, pathfinding, items, or objectives. Those are Phase 1.

---

## Architecture Decisions

### New Engine, Transplanted Logic

- WSS2 gets a **brand new game engine** built from scratch inside the existing project.
- Old WSS1 prototype components stay intact (they're the Assignment 1 deliverable).
- Proven algorithms (A*, combat math, terrain costs) will be **rewritten cleanly** into the new architecture when needed in later phases — not copy-pasted.

### Tech Stack

- **Rendering:** HTML5 Canvas (not DOM elements) — single `<canvas>` element
- **Game Loop:** `requestAnimationFrame` with fixed timestep (60 ticks/sec target)
- **State:** Game state lives in plain TypeScript objects, NOT React state. React only owns the UI shell (menus, HUD overlay, settings panel).
- **Language:** TypeScript with interfaces for all data structures
- **File Location:** `src/wss2/` — completely separate from existing `src/components/` and `src/combat/`

### Deterministic Seeding

- Map generation and all RNG use a **seedable PRNG** (pseudo-random number generator).
- Every run is reproducible given the same seed.
- Seeds are displayed in the UI and can be entered manually for replay/testing.

---

## Folder Structure

```
src/wss2/
├── core/
│   ├── Game.ts              — Main game class (owns loop, state transitions)
│   ├── GameLoop.ts          — Fixed-timestep loop with RAF
│   ├── types.ts             — All shared interfaces and types
│   └── PRNG.ts              — Seedable pseudo-random number generator
├── world/
│   ├── GridMap.ts           — 2D tile array, queries (getTile, isWalkable, getNeighbors)
│   ├── Tile.ts              — Tile data (terrainType, walkable, movementCost, coverValue)
│   └── MapGenerator.ts      — Procedural map generation (terrain only for Phase 0)
├── entities/
│   ├── Entity.ts            — Base entity (id, position, alive, update)
│   └── EntityManager.ts     — Entity list management (add, remove, query by position/type)
├── rendering/
│   ├── Renderer.ts          — Canvas rendering engine (grid, entities, camera)
│   └── Camera.ts            — Viewport/camera (position, zoom, pan)
└── ui/
    └── WSS2Game.tsx          — React wrapper component (canvas mount, HUD, settings)
```

---

## Build Order (Step by Step)

### Step 1: Core Types & Interfaces

Define all the data structures the engine will use. No logic yet — just the shapes of things.

**File: `src/wss2/core/types.ts`**

```typescript
// Game states
type GameState = 'MENU' | 'RUNNING' | 'PAUSED' | 'END';

// Position (float coordinates for sub-tile entities)
interface Position { x: number; y: number; }

// Grid coordinate (integer, for tile lookups)
interface GridCoord { col: number; row: number; }

// Terrain types (Phase 0 = simple set, expand in Phase 1+)
type TerrainType = 'grass' | 'dirt' | 'stone' | 'water' | 'wall';

// Tile data
interface TileData {
  terrainType: TerrainType;
  walkable: boolean;
  movementCost: number;
  coverValue: number;       // 0 = none, 0.25 = half, 0.5 = full
  coverDirection: Direction | null;
}

// Directions
type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

// Faction (defined now, used in Phase 1)
type Faction = 'PLAYER_TEAM' | 'HOSTILE' | 'NEUTRAL';

// Entity base
interface EntityData {
  id: string;
  position: Position;
  radius: number;          // sub-tile size (0.3-0.4)
  alive: boolean;
  faction: Faction;
}

// Game config
interface GameConfig {
  mapWidth: number;         // 30-60
  mapHeight: number;        // 30-60
  tickRate: number;         // target ticks per second (60)
  seed: number;             // PRNG seed
  gameSpeed: number;        // multiplier (0.5x, 1x, 2x, etc.)
}
```

### Step 2: Seedable PRNG

A simple, fast, deterministic random number generator.

**File: `src/wss2/core/PRNG.ts`**

- Implement a Mulberry32 or similar seedable PRNG
- Methods: `next()` → 0-1 float, `nextInt(min, max)`, `nextFloat(min, max)`, `pick(array)`
- Seed stored and displayable for replay

### Step 3: Grid Map & Tiles

The world grid that everything lives on.

**File: `src/wss2/world/Tile.ts`**

- Factory function to create tiles from terrain type
- Terrain type → walkable/movementCost/coverValue defaults

**File: `src/wss2/world/GridMap.ts`**

- Constructor takes width, height
- `tiles: TileData[][]` — 2D array
- `getTile(col, row): TileData | null`
- `isWalkable(col, row): boolean`
- `getNeighbors(col, row): GridCoord[]` — 4-directional neighbors
- `isInBounds(col, row): boolean`

### Step 4: Basic Map Generator

Procedural terrain generation — simple for Phase 0, expandable later.

**File: `src/wss2/world/MapGenerator.ts`**

- Takes `GameConfig` and `PRNG` instance
- Returns a populated `GridMap`
- Phase 0 algorithm:
  1. Fill with grass
  2. Scatter some dirt patches (clustered noise)
  3. Place stone/wall clusters (future building sites)
  4. Add a few water tiles (impassable)
  5. Clear the center area for survivor spawn
  6. Place a portal marker tile at center
- Use the PRNG for all randomness (deterministic)

### Step 5: Entity System

Base entity management — no AI or combat yet, just existence on the map.

**File: `src/wss2/entities/Entity.ts`**

- Create entity from `EntityData`
- `getCurrentTile(): GridCoord` — floor(position) for grid lookups
- `distanceTo(other: EntityData): number` — Euclidean distance

**File: `src/wss2/entities/EntityManager.ts`**

- `entities: EntityData[]`
- `addEntity(entity): void`
- `removeEntity(id): void`
- `getEntitiesAt(col, row): EntityData[]` — all entities on a tile
- `getEntitiesByFaction(faction): EntityData[]`
- `getEntitiesInRadius(pos, radius): EntityData[]`

### Step 6: Camera & Viewport

Controls what portion of the grid is visible on screen.

**File: `src/wss2/rendering/Camera.ts`**

- `position: Position` — center of viewport in world coordinates
- `zoom: number` — tile size in pixels (default ~24-32px)
- `viewportWidth: number`, `viewportHeight: number` — canvas size in pixels
- `worldToScreen(pos: Position): {x, y}` — convert world coords to canvas pixels
- `screenToWorld(screenX, screenY): Position` — convert canvas clicks to world coords
- `getVisibleBounds(): { minCol, maxCol, minRow, maxRow }` — which tiles to render
- `pan(dx, dy)`, `setZoom(level)`

### Step 7: Canvas Renderer

Draws the grid and entities to an HTML Canvas.

**File: `src/wss2/rendering/Renderer.ts`**

- Takes a `<canvas>` element reference
- `render(gridMap, entityManager, camera): void`
- **Tile rendering:**
  - Only draw tiles within camera's visible bounds (viewport culling)
  - Color-code by terrain type (grass=green, dirt=brown, stone=gray, water=blue, wall=dark)
  - Draw grid lines for clarity
- **Entity rendering:**
  - Draw entities as colored circles at their float positions
  - Size based on entity radius × tile pixel size
  - Color based on faction (blue=PLAYER_TEAM, red=HOSTILE, yellow=NEUTRAL)
- **HUD overlay:**
  - Tick counter in corner
  - Current seed display
  - Game speed indicator

### Step 8: Game Loop

The heart of the engine — fixed timestep update loop.

**File: `src/wss2/core/GameLoop.ts`**

- Uses `requestAnimationFrame` for rendering
- **Fixed timestep** for game logic (60 ticks/sec default)
  - Accumulates delta time
  - Runs `update()` in fixed-size steps
  - Renders once per frame regardless of tick count
- `start()`, `stop()`, `pause()`, `resume()`
- Game speed multiplier affects tick accumulation rate
- Tracks: `currentTick`, `elapsedTime`, `fps`

### Step 9: Game Class (Orchestrator)

Ties everything together.

**File: `src/wss2/core/Game.ts`**

- Owns: `GameLoop`, `GridMap`, `EntityManager`, `Renderer`, `Camera`, `PRNG`
- `init(config: GameConfig, canvas: HTMLCanvasElement): void`
  1. Create PRNG from seed
  2. Generate map
  3. Create entity manager
  4. Spawn placeholder entities (3 survivors at center, a few "enemies" scattered)
  5. Set up camera centered on map
  6. Create renderer
  7. Start game loop
- `update(tick): void` — called each tick
  - Phase 0: just increment tick counter, entities don't move yet
- `render(): void` — called each frame
  - Renderer draws current state
- `setSpeed(multiplier): void`
- `pause() / resume()`
- `getState(): GameState`

### Step 10: React UI Wrapper

The React component that hosts the Canvas and provides controls.

**File: `src/wss2/ui/WSS2Game.tsx`**

- Mounts a `<canvas>` element via React ref
- On mount: creates `Game` instance, calls `init(config, canvas)`
- **Settings Panel** (sidebar or top bar):
  - Map size selector (30x30, 40x40, 60x60)
  - Seed input (auto-generated or manual entry)
  - Game speed slider (0.5x, 1x, 2x, 4x)
  - Pause/Resume button
  - New Game button (regenerate with new/same seed)
- **HUD Overlay** (on canvas):
  - Tick counter
  - FPS counter
  - Current seed
  - Game state (RUNNING/PAUSED)
- **Camera Controls:**
  - Arrow keys or WASD to pan
  - Mouse wheel to zoom
  - Click to select tile (show tile info)
- Register this component in `App.tsx` as a new navigation option: "A Forgotten Place"

---

## Definition of Done

Phase 0 is complete when:

- [ ] "A Forgotten Place" appears in the app navigation menu
- [ ] Clicking it shows a Canvas with a procedurally generated grid
- [ ] Grid has varied terrain (grass, dirt, stone, water, walls)
- [ ] Placeholder entities (colored circles) appear on the grid
- [ ] Game loop runs at 60 ticks/sec with visible tick counter
- [ ] Pause/Resume works
- [ ] Game speed slider works (0.5x to 4x)
- [ ] Seed is displayed; entering the same seed produces the same map
- [ ] Camera can pan (WASD/arrows) and zoom (mouse wheel)
- [ ] New Game button regenerates the map
- [ ] No existing WSS1 demos are broken

---

## Implementation Notes

### HUD Rendering
- HUD elements (tick counter, FPS, seed, game state) are rendered as a **React overlay** on top of the Canvas, NOT drawn on the canvas itself.
- This keeps the Canvas renderer focused on game world rendering and avoids camera transform interference with UI text.
- The React overlay uses absolute positioning over the canvas container.

### Canvas Sizing & Device Pixel Ratio
- On mount, check `window.devicePixelRatio` and scale the canvas buffer accordingly for crisp rendering on high-DPI screens.
- Handle window resize events — update canvas dimensions and camera viewport when the container resizes.
- Canvas CSS size and buffer size should be set independently (CSS for layout, buffer for rendering sharpness).

### WSS1 Isolation
- All WSS2 code lives in `src/wss2/`. No files outside this directory should be modified except `src/App.tsx` (to add the navigation entry).
- WSS1 components in `src/components/`, `src/combat/`, and `src/replit/` must remain untouched.

---

## What Phase 0 Does NOT Include

These are explicitly **Phase 1** and should not be built in Phase 0:

- AI brains / decision-making
- Pathfinding (A*)
- Combat system
- Fog of war
- Items / inventory / loot
- Objectives
- Corruption Nests / Rift Portals (as functional entities)
- Biome-specific generation
- Sprite rendering (Phase 0 uses colored shapes)
- Sound / noise system

---

## Algorithms to Transplant Later (Reference)

When these systems are needed in future phases, reference the old WSS1 code:

| System | Source File | What to Reuse |
|--------|------------|---------------|
| A* Pathfinding | `src/replit/Pathfinder.tsx` | Core A* algorithm, neighbor evaluation, cost calculation |
| Combat Math | `src/combat/ZombiesAhh.tsx` | Damage formulas, hit chance, weapon stats |
| Trade Evaluation | `src/components/RobotTrading.tsx` | Value comparison logic, trade acceptance criteria |
| Terrain Costs | `src/components/TerrainGame.tsx` | Movement cost tables, terrain type effects |
| Spawner Logic | `src/replit/Spawner.tsx` | Resource pool, cooldown, capacity management |
| Brain Decisions | `src/combat/WSSRogueHDraft.tsx` | Decision tree structure, priority evaluation |

---

## Testing Strategy

### Deterministic Seed Tests
- Store known seeds with expected outcomes
- Assert: map with seed X produces the same tile layout every time
- Assert: entity placement is identical for the same seed

### Runtime Invariants
- Entity position is always within map bounds
- No entity has negative health (future)
- All tiles have valid terrain types
- Grid dimensions match config

### Manual Verification
- Visual inspection of generated maps
- Camera controls responsive
- Speed slider affects tick rate correctly
- Pause/resume toggles cleanly

---

## Notes for AI Coding Assistants

- **Do NOT modify** any files in `src/components/`, `src/combat/`, or `src/replit/`. Those are WSS1 and must stay intact.
- **Do NOT modify** `server.js`, `vite.config.ts`, or `package.json` (use proper tools for dependencies).
- All WSS2 code goes in `src/wss2/`.
- Use TypeScript interfaces, not classes, for data structures. Use classes only for systems that need methods (Game, GameLoop, Renderer, Camera).
- The Canvas renderer should be performant — only draw what's in the viewport.
- Keep the React component thin — it's just a shell for the Canvas and controls.
