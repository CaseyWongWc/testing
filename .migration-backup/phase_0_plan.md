# Phase 0 Plan — "A Forgotten Place" (WSS2)

> **Purpose:** This is the definitive coding brief for Phase 0. Merged from both the Replit and Perplexity plans. Read this at the start of every coding thread. Keep `wss(full game ideas)/` as the long-term vision archive — this file is the "what to build RIGHT NOW" document.

> **Last Updated:** February 2026

> **Authors:** Casey Wong × Replit Agent × Perplexity Deep Research

> **Status:** READY TO BUILD

---

## Goal

Build the **foundation** of the WSS2 game engine: a working game loop, entity system, grid world, Canvas renderer, and basic random entity movement. By the end of Phase 0, you should be able to:

1. Launch "A Forgotten Place" from the app menu
2. See a procedurally generated grid rendered on an HTML Canvas
3. Watch placeholder entities (colored circles) **wander randomly** on the grid
4. See the game loop ticking at 60 ticks/sec with a visible tick/FPS counter
5. Pause/resume and adjust game speed with a slider
6. Enter a seed and get the **exact same** map + entity behavior every time

**Phase 0 is NOT:** AI brains, pathfinding (A*), combat, fog of war, items, objectives, or sprites. Those are Phase 1+.

**Phase 0 DOES include:** Random PRNG-driven wandering so the engine proves entities can move, respect terrain, and be tracked by the renderer. This de-risks Phase 1 significantly.

---

## Architecture Decisions

### New Engine, Transplanted Logic (ADR-001)

- WSS2 gets a **brand new game engine** built from scratch inside the existing project.
- Old WSS1 prototype components stay intact (they're the Assignment 1 deliverable).
- Proven algorithms (A*, combat math, terrain costs) will be **rewritten cleanly** into the new architecture when needed in later phases — not copy-pasted.

### Tech Stack (Locked)

- **Rendering:** HTML5 Canvas (not DOM elements) — single `<canvas>` element
- **Game Loop:** `requestAnimationFrame` with fixed timestep (60 ticks/sec target)
- **State:** Game state lives in plain TypeScript objects, NOT React state. React only owns the UI shell (menus, HUD overlay, settings panel).
- **Language:** TypeScript (strict mode) with interfaces for all data structures
- **File Location:** `src/wss2/` — completely separate from existing `src/components/` and `src/combat/`
- **Styling:** Tailwind CSS for UI panels
- **No `Math.random()`:** Every random call goes through the seedable PRNG

### Deterministic Seeding (ADR-004)

- Map generation, entity placement, and all entity movement use a **seedable PRNG**.
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
│   ├── Tile.ts              — Tile data + terrain cost table
│   └── MapGenerator.ts      — Procedural map generation (terrain only for Phase 0)
├── entities/
│   ├── Entity.ts            — Base entity (id, position, alive, update, movement)
│   └── EntityManager.ts     — Entity list management (add, remove, query by position/type)
├── rendering/
│   ├── Renderer.ts          — Canvas rendering engine (grid, entities, camera)
│   └── Camera.ts            — Viewport/camera (position, zoom, pan)
└── ui/
    └── WSS2Game.tsx          — React wrapper component (canvas mount, HUD, settings)
```

---

## Build Order (11 Steps, Sequential)

Each step produces a testable, runnable result before moving to the next.

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

// Terrain cost table (defines resource costs per terrain — active in Phase 1, defined now)
interface TerrainCosts {
  movementCost: number;
  waterCost: number;     // water depletion rate
  foodCost: number;      // food depletion rate (negative = forage gain)
  coverValue: number;    // 0 = none, 0.25 = half, 0.5 = full
}

// Tile data
interface TileData {
  terrainType: TerrainType;
  walkable: boolean;
  movementCost: number;
  coverValue: number;
  coverDirection: Direction | null;
  // Future-ready fields (not used in Phase 0)
  elevation: number;     // 0-3, used in Phase 1 for vision/combat
}

// Directions
type Direction = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

// Faction
type Faction = 'PLAYER_TEAM' | 'HOSTILE' | 'NEUTRAL';

// Entity base
interface EntityData {
  id: string;
  position: Position;
  radius: number;          // sub-tile size (0.3-0.4)
  alive: boolean;
  faction: Faction;
  moveSpeed: number;       // tiles per second (used for wandering)
  actionLog: ActionLogEntry[];
}

// Action log entry — every entity action is logged with a reason
interface ActionLogEntry {
  tick: number;
  action: string;
  reason: string;
  position: Position;
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

- Implement Mulberry32 (or similar) seedable PRNG
- Methods: `next()` → 0-1 float, `nextInt(min, max)`, `nextFloat(min, max)`, `pick(array)`, `nextBool(chance)`
- Seed stored and displayable for replay
- **No `Math.random()` anywhere in `src/wss2/`** — all randomness flows through PRNG

**Test:** Given seed 12345, calling `next()` 10 times always returns the exact same 10 values.

### Step 3: Grid Map & Tiles

The world grid that everything lives on.

**File: `src/wss2/world/Tile.ts`**

- Factory function to create tiles from terrain type
- Terrain type → walkable/movementCost/coverValue/elevation defaults
- **Terrain Cost Table** (defined now, resource costs active in Phase 1):

| Terrain | Move Cost | Water Cost | Food Cost | Cover | Elevation Range |
|---------|-----------|------------|-----------|-------|-----------------|
| Grass   | 1.0       | 1.0        | 0.0       | 0.0   | 0-1             |
| Dirt    | 1.0       | 1.0        | 0.5       | 0.0   | 0-1             |
| Stone   | 1.5       | 1.5        | 1.0       | 0.25  | 1-2             |
| Water   | Impassable| —          | —         | 0.0   | 0               |
| Wall    | Impassable| —          | —         | 0.5   | 2-3             |

**File: `src/wss2/world/GridMap.ts`**

- Constructor takes width, height
- `tiles: TileData[][]` — 2D array
- `getTile(col, row): TileData | null`
- `isWalkable(col, row): boolean`
- `getNeighbors(col, row): GridCoord[]` — 4-directional neighbors (8-directional optional)
- `isInBounds(col, row): boolean`

### Step 4: Basic Map Generator

Procedural terrain generation — simple for Phase 0, expandable later.

**File: `src/wss2/world/MapGenerator.ts`**

- Takes `GameConfig` and `PRNG` instance
- Returns a populated `GridMap`
- Phase 0 algorithm:
  1. Fill with grass
  2. Scatter dirt patches (clustered noise)
  3. Place stone/wall clusters (future building sites)
  4. Add water tiles (impassable, small ponds/rivers)
  5. Clear the center area for survivor spawn
  6. Place a portal marker tile at center
- **All randomness via PRNG** (deterministic)
- Start zone: center of map. Goal zone: not defined yet (Phase 1).

**Test:** Seed 12345 on a 30×30 grid always produces the identical terrain layout. Tile at (5,10) is always the same terrain type.

### Step 5: Entity System

Base entity management — existence on the map plus simple random wandering.

**File: `src/wss2/entities/Entity.ts`**

- **Implementation:** Entity is a **class** (it has behavior/methods), but its serializable state conforms to the `EntityData` interface. This follows the rule: "Use classes only for systems that need methods."
- `getCurrentTile(): GridCoord` — `Math.floor(position)` for grid lookups
- `distanceTo(other: EntityData): number` — Euclidean distance
- `update(gridMap, prng, tick): void` — **random wandering**:
  - Each tick, small chance (configurable, e.g. 5%) to pick a new random walkable neighbor tile as movement target
  - Smoothly move toward target at `moveSpeed` tiles/sec
  - Respect terrain — never walk into impassable tiles
  - Log every movement decision with a reason string: `"Wandering north — no objective"` or `"Idle — waiting"`

**File: `src/wss2/entities/EntityManager.ts`**

- `entities: EntityData[]`
- `addEntity(entity): void`
- `removeEntity(id): void`
- `getEntitiesAt(col, row): EntityData[]` — all entities on a tile
- `getEntitiesByFaction(faction): EntityData[]`
- `getEntitiesInRadius(pos, radius): EntityData[]`
- `updateAll(gridMap, prng, tick): void` — calls `update()` on every entity

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
  - Color-code by terrain type:
    | Terrain | Color |
    |---------|-------|
    | Grass   | `#4CAF50` (green) |
    | Dirt    | `#8D6E63` (brown) |
    | Stone   | `#9E9E9E` (gray) |
    | Water   | `#42A5F5` (blue) |
    | Wall    | `#37474F` (dark) |
  - Draw grid lines for clarity
- **Entity rendering:**
  - Draw entities as colored circles at their **float positions** (smooth movement visible)
  - Size based on entity `radius × tilePixelSize`
  - Color based on faction: blue=PLAYER_TEAM, red=HOSTILE, yellow=NEUTRAL

### Step 8: Game Loop

The heart of the engine — fixed timestep update loop.

**File: `src/wss2/core/GameLoop.ts`**

- Uses `requestAnimationFrame` for rendering
- **Fixed timestep** for game logic (60 ticks/sec default)
  - Accumulates delta time
  - Runs `update()` in fixed-size steps (1/60th sec per tick)
  - Renders once per frame regardless of tick count
  - Cap: max 4 ticks per frame to prevent spiral of death
- `start()`, `stop()`, `pause()`, `resume()`
- Game speed multiplier affects tick accumulation rate
- Tracks: `currentTick`, `elapsedTime`, `fps` (smoothed rolling average)

### Step 9: Game Class (Orchestrator)

Ties everything together.

**File: `src/wss2/core/Game.ts`**

- Owns: `GameLoop`, `GridMap`, `EntityManager`, `Renderer`, `Camera`, `PRNG`
- `init(config: GameConfig, canvas: HTMLCanvasElement): void`
  1. Create PRNG from seed
  2. Generate map via MapGenerator
  3. Create entity manager
  4. Spawn placeholder entities:
     - 3 survivors (PLAYER_TEAM) near center
     - 4-5 hostiles (HOSTILE) scattered randomly on walkable tiles
     - 2 neutrals (NEUTRAL) scattered randomly
  5. Set up camera centered on map
  6. Create renderer
  7. Start game loop
- `update(tick): void` — called each tick
  - EntityManager.updateAll() — entities wander randomly
- `render(): void` — called each frame
  - Renderer draws current state
- `setSpeed(multiplier): void`
- `pause() / resume()`
- `getState(): GameState`
- `destroy(): void` — clean up RAF, event listeners

### Step 10: React UI Wrapper

The React component that hosts the Canvas and provides controls.

**File: `src/wss2/ui/WSS2Game.tsx`**

- Mounts a `<canvas>` element via React ref
- On mount: creates `Game` instance, calls `init(config, canvas)`
- On unmount: calls `Game.destroy()` to prevent memory leaks
- **Settings Panel** (sidebar or top bar):
  - Map size selector (30x30, 40x40, 60x60)
  - Seed input (auto-generated or manual entry)
  - Game speed slider (0.5x, 1x, 2x, 4x)
  - Pause/Resume button
  - New Game button (regenerate with new/same seed)
- **HUD Overlay** (React, NOT canvas-drawn):
  - Tick counter
  - FPS counter
  - Current seed
  - Game state (RUNNING/PAUSED)
  - Entity count by faction
- **Camera Controls:**
  - Arrow keys or WASD to pan
  - Mouse wheel to zoom
  - Click to select tile (show tile info: terrain type, entities on tile)
- Register this component in `App.tsx` as a new navigation option: "A Forgotten Place"

### Step 11: Golden Seed Test & Polish

The final validation step before Phase 0 is declared complete.

**The Golden Seed Test:**
1. Set seed to **12345**, map size **30×30**, speed **1x**
2. Click Start
3. Watch entities wander randomly for 300 ticks (~5 seconds)
4. Record: tick count, entity positions, map layout
5. Reset. Enter same seed **12345**. Click Start.
6. **Result must be IDENTICAL** — same map, same entity positions at tick 300, same movement paths

If this test ever fails after any code change, something broke determinism. Rollback.

**Polish:**
- Verify all controls work (pause, resume, speed slider, new game)
- Verify camera pan/zoom is smooth
- Verify entities respect terrain boundaries (never walk into water/walls)
- Check DPR scaling on high-DPI screens

---

## Definition of Done

Phase 0 is complete when ALL of these are true:

- [ ] "A Forgotten Place" appears in the app navigation menu
- [ ] Clicking it shows a Canvas with a procedurally generated grid
- [ ] Grid has varied terrain (grass, dirt, stone, water, walls) with distinct colors
- [ ] Placeholder entities (colored circles) appear on the grid at float positions
- [ ] **Entities wander randomly**, respecting terrain (never entering impassable tiles)
- [ ] **Every entity action is logged** with a tick number and reason string
- [ ] Game loop runs at 60 ticks/sec with visible tick counter and FPS display
- [ ] Pause/Resume works
- [ ] Game speed slider works (0.5x to 4x)
- [ ] Seed is displayed; entering the same seed produces the same map AND entity behavior
- [ ] **Golden Seed Test passes** (seed 12345, 30×30 → identical replay)
- [ ] Camera can pan (WASD/arrows) and zoom (mouse wheel)
- [ ] New Game button regenerates the map
- [ ] No `Math.random()` calls anywhere in `src/wss2/`
- [ ] Code is TypeScript strict mode, no `any` types
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

### Action Logging (Explainability)
- Every entity decision must include a human-readable `reason` string in its `actionLog`.
- This is a core architectural requirement — the game's value proposition is watching AI make decisions and understanding WHY.
- Example reasons: `"Wandering east — no objective"`, `"Idle — waiting for next move"`, `"Blocked — water tile to the north"`
- **Log retention:** Action logs are kept in-memory per entity. Phase 0 caps at the last **200 entries** per entity to prevent unbounded growth. Phase 1 may add persistence or export.
- In Phase 1, Brain-based decisions will produce richer reasons: `"Moving to forest — food critically low (12)"`, `"Engaging zombie — threat detected at range 3"`

---

## What Phase 0 Does NOT Include

These are explicitly **Phase 1+** and should not be built in Phase 0:

- AI brains / decision-making (Phase 1 — random wandering only)
- Pathfinding / A* (Phase 1 — random neighbor selection only)
- Combat system (Phase 1)
- Fog of war (Phase 1 — but Vision concept ready)
- Items / inventory / loot (Phase 1)
- Objectives / win conditions (Phase 1)
- Corruption Nests / Rift Portals as functional entities (Phase 1)
- Biome-specific generation (Phase 1)
- Sprite rendering (Phase 0 uses colored circles)
- Sound / noise system (Phase 2)
- Day/night cycle (Phase 2)
- Trading system (Phase 2)
- Buildings/structures (Phase 2)
- Resource depletion per terrain (Phase 1 — but cost table defined now)

---

## Terrain Cost Table (Future Reference)

Defined in Phase 0 for forward compatibility. Resource costs become active in Phase 1 when the survival loop is implemented.

| Terrain | Move Cost | Water Cost | Food Cost | Cover | Walkable |
|---------|-----------|------------|-----------|-------|----------|
| Grass   | 1.0       | 1.0        | 0.0       | 0.0   | Yes      |
| Dirt    | 1.0       | 1.0        | 0.5       | 0.0   | Yes      |
| Stone   | 1.5       | 1.5        | 1.0       | 0.25  | Yes      |
| Forest* | 2.0       | 1.0        | -1.0      | 0.25  | Yes      |
| Desert* | 2.0       | 3.0        | 2.0       | 0.0   | Yes      |
| Water   | —         | —          | —         | 0.0   | No       |
| Wall    | —         | —          | —         | 0.5   | No       |
| Road*   | 0.5       | 1.0        | 1.0       | 0.0   | Yes      |

*Forest, Desert, and Road are Phase 1+ terrain types. Phase 0 uses: Grass, Dirt, Stone, Water, Wall.

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

## Future System Interfaces (Keep In Mind)

These systems are specced in `wss(full game ideas)/systems/` but NOT built in Phase 0. The Phase 0 architecture should not block them:

- **Vision Formula:** `effective_vision = base_vision × trait_mult × status_mult × timeOfDay_mult` (see `fog-and-vision.md`)
- **Spawner Entity:** Will need `spawnCooldown`, `maxAliveFromThisSpawner`, `spawnType` properties (see `spawners-and-enemies.md`)
- **3-Class Weapons:** Fists → Melee (durability) → Guns (ammo + reload) (see `combat.md`)
- **Objective System:** `ObjectiveManager` with 6 objective types (see `win-conditions.md`)
- **Brain Interface:** 5 personality types (Balanced, Aggressive, Cautious, Hoarder, Explorer) (see `ai-brains.md`)

---

## Testing Strategy

### The Golden Seed Test (Regression Protocol)

**Named test, run after every code change:**

1. Seed: **12345**, Map: **30×30**, Brain: none (random wander), Speed: **1x**
2. Run for exactly **300 ticks**
3. Record: map layout, entity positions, action logs
4. Reset with same seed. Run again.
5. **Everything must be identical.** If not, determinism is broken → rollback.

**Determinism requirements:**
- Game loop uses fixed timestep (not variable delta) — same number of `update()` calls per run
- EntityManager iterates entities in **insertion order** (stable iteration) — entity array is never re-sorted during update
- All randomness flows through the single PRNG instance — no `Math.random()`, no `Date.now()` for gameplay decisions

### Deterministic Seed Tests
- Store known seeds with expected outcomes
- Assert: map with seed X produces the same tile layout every time
- Assert: entity placement is identical for the same seed
- Assert: entity movement after N ticks is identical for the same seed

### Runtime Invariants
- Entity position is always within map bounds
- Entity position never overlaps an impassable tile
- All tiles have valid terrain types
- Grid dimensions match config
- No `Math.random()` calls in src/wss2/

### Manual Verification
- Visual inspection of generated maps
- Camera controls responsive
- Speed slider affects tick rate correctly
- Pause/resume toggles cleanly
- Entities visibly move and avoid water/walls

---

## Estimated Effort

| Step | Description | Est. Time |
|------|-------------|-----------|
| 1 | Core Types & Interfaces | 30 min |
| 2 | Seedable PRNG | 1 hour |
| 3 | Grid Map & Tiles | 1-2 hours |
| 4 | Basic Map Generator | 2-3 hours |
| 5 | Entity System + Random Wandering | 2-3 hours |
| 6 | Camera & Viewport | 1-2 hours |
| 7 | Canvas Renderer | 3-4 hours |
| 8 | Game Loop | 2-3 hours |
| 9 | Game Orchestrator | 1-2 hours |
| 10 | React UI Wrapper | 2-3 hours |
| 11 | Golden Seed Test & Polish | 1-2 hours |
| — | **Total** | **~15-25 hours** |

With AI coding assistance, this could compress to 10-15 hours of focused work.

---

## How to Use This Document

### In a coding thread:
> "Read phase_0_plan.md. We are implementing Step [N]. Build exactly what it describes. Do not add features from future phases."

### When making an architecture decision:
> "Create an ADR in docs/decisions/ before writing code. Format: Context → Decision → Consequences → Dependencies."

### When something feels wrong:
> "Run the Golden Seed Test (seed 12345, 30×30). If the result changed, something broke. Rollback."

---

## Notes for AI Coding Assistants

- **Do NOT modify** any files in `src/components/`, `src/combat/`, or `src/replit/`. Those are WSS1 and must stay intact.
- **Do NOT modify** `server.js`, `vite.config.ts`, or `package.json` (use proper tools for dependencies).
- All WSS2 code goes in `src/wss2/`.
- Use TypeScript interfaces, not classes, for data structures. Use classes only for systems that need methods (Game, GameLoop, Renderer, Camera, EntityManager).
- The Canvas renderer should be performant — only draw what's in the viewport.
- Keep the React component thin — it's just a shell for the Canvas and controls.
- **Every entity action must have a logged reason string.** This is non-negotiable.
- **No `Math.random()`** — all randomness through PRNG.
- Performance target: 60fps with a 60×60 grid and 20+ entities.
