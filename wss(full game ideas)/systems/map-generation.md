# Map Generation System

Procedural generation of themed biome maps with semi-randomized structures, terrain types, and points of interest.

---

## Overview

Maps are generated as square grids with configurable size. Survivors spawn near the center of the map with the portal also placed in the center (starts SEALED). The map generation system supports an optional center frame maze around the spawn hub, maze pockets as sub-areas, and biome-themed terrain.

Map generation covers terrain, structures/buildings, vehicles, wreckages, debris, entity placement, and loot distribution — not just terrain tiles.

Entity sizing is **sub-tile** — entities are smaller than tiles, maps stay 30x30 to 60x60. Map generation places entities at float positions within tiles. Buildings use a **Stamp Library + Placement Rules + Dressing Pass** system (details in Building Generation section).

---

## Grid Structure

Map size is a configurable parameter tied to difficulty level:

- **Easy** -- smaller maps (30x30), fewer objectives, less ground to cover
- **Normal** -- default play size (40x40)
- **Hard** -- larger maps (50x50–60x60), more objectives, greater distance between resources

Configurable range: **30–60 tiles** per side.

Grid format: square tiles only. Single layer (no multi-floor in v0.1). Coordinate system is (x, y) with (0,0) at top-left.

---

## Map Generation Pipeline

The map generator runs the following steps in order:

1. **Terrain Generation** -- lay down base terrain tiles per biome rules
2. **Structure Placement** -- stamp buildings, bunkers, caves, and other structures
3. **Vehicle & Wreckage Placement** -- scatter vehicles, wrecks, and debris for cover and atmosphere
4. **Corruption Nest Placement** -- place nests according to spread and distance rules
5. **Rift Portal Placement** -- place the portal at the center or a designated location
6. **Objective Marker Placement** -- distribute objective locations across the map
7. **Trader NPC Placement** -- place trader NPCs in accessible but off-center locations
8. **Static Loot Placement** -- distribute loot items across the map (details TBD, but integrated into map gen)
9. **Survivor Start Position** -- place survivors at the center of the map near the portal

---

## Center Spawn Concept

Survivors spawn near the **center** of the map. The portal is placed in the center and starts **SEALED** (transitions to OPEN when all objectives are complete, then ACTIVATED when survivors enter).

- Portal exists as an inactive floor tile in the hub area.
- Survivors can walk over the inactive portal freely.
- Portal only triggers evacuation after it becomes ACTIVE (unlocked by ObjectiveManager).
- Survivors spawn neatly arranged on top of or around the inactive portal each new map.

---

## Center Frame Maze (Optional Hub Ring)

A rectangular frame maze can sit at the center of the map around the spawn hub. This is controlled by a toggle.

**Toggle:** `center_frame_enabled` (if off, use normal center spawn without ring)

### v0.1 Implementation (Simple Geometry)

No full maze algorithm required initially:

1. Hub inner size: `hub_inner_w = 8`, `hub_inner_h = 8`
2. Frame thickness: `frame_thickness = 2` tiles
3. Carve a rectangle ring (walls) around the hub
4. Add `gate_count = 2` openings on opposite sides (2-4 gates total)
5. Place survivors + portal in the hub center

### v0.2 Upgrade (Real Frame Maze)

Run a maze algorithm only inside the frame band (the donut/ring area), then thicken corridors. Keep hub interior open for readability.

### Parameters

- `center_frame_enabled`: true/false
- `frame_thickness_tiles`: 2
- `gate_count`: 2 or 4
- `hub_inner_size`: 8x8 (tune later)

### Design Risks and Controls

- **Risk:** Survivors can camp forever in the ring.
  - **Control:** Portal is LOCKED until objectives complete.
  - **Control:** Spawners or onslaught pressure can eventually push inward (later phases).
- **Risk:** Pathing bottlenecks.
  - **Control:** Add 2-4 gates (openings) in the frame.

---

## Entity Placement Rules

### Corruption Nest Placement

- Nests are spread across the map to avoid clustering.
- Minimum distance from survivor spawn point (center) to prevent early overwhelm.
- Placed near or between objective locations to create threat around goals.
- Nest tier (SMALL/MEDIUM/LARGE) scales with distance from center — larger nests further out.
- Number of nests scales with difficulty and map size.

### Rift Portal Placement

- Placed at the center of the map (default) or at a specific designated location.
- Starts in SEALED state, transitions to OPEN when objectives are met.
- Must be on a walkable tile with clearance around it for survivor positioning.

### Trader NPC Placement

- Placed in accessible locations, typically near structures or points of interest.
- Not placed at the center (avoid clustering with spawn point).
- At least one trader per map; additional traders on larger/harder maps.

### Objective Marker Placement

- Distributed across the map to encourage exploration.
- Minimum distance between objectives to prevent trivial completion.
- At least one objective in each quadrant of the map on larger maps.

### Static Loot Placement (LOCKED)

Loot is distributed via two channels: **pre-placed during map generation** and **dropped from human enemy kills**.

- **Building-clustered:** Loot is concentrated inside buildings (loot sockets in stamps) and around structures. Buildings are the primary loot source.
- **Random scatter:** Loot also appears randomly in open terrain. A **pre-game slider** controls how scattered vs. concentrated loot is per terrain type.
- **No rarity tier labels:** Loot does not use explicit common/rare/legendary labels.
- **Difficulty-driven quality:** Higher map difficulty = better loot available. Tougher human enemies (bandits, raiders, military) carry and drop better gear.
- **Enemy drops:** Human enemies drop their equipped weapons, ammo, and carried items on death. This is a major loot source alongside pre-placed items.

**OPEN — Loot Bias Model:** How strongly does distance from spawn vs. difficulty level drive loot quality? Options under consideration:
- (A) **Stepped tiers** — each difficulty/map tier has a base loot quality range, plus a mild distance bonus
- (B) **Strong distance gradient** — near spawn is mostly junk, high-end loot only far from spawn or in special POIs
- (C) **Difficulty-driven, distance as flavor** — difficulty does the heavy lifting, distance only nudges slightly

---

## Maze Integration

### Option A (Recommended for v0.1): Maze Pockets Inside Buildings/Caves

Use the normal biome map as the main overworld, then stamp in maze pockets as sub-areas:

- A maze inside a building (hallways/rooms)
- A maze inside a cave
- A maze inside an underground bunker

This keeps open spaces for roaming and onslaught pressure while reusing existing maze algorithms without making the whole map claustrophobic.

### Option B: Mazes as Main Level Layout

Generate the whole map as a maze, then skin it with a biome theme. Good for "dense forest" or "lab corridor" vibes. Risk: can feel repetitive if every level is maze-shaped.

### Option C: Mazes as Objective Gating

Make objectives require entering a maze (switch at maze end, rescue NPC deep inside, item pickup inside with delivery outside).

### Labyrinth as Special Level Type

Labyrinth is treated as a **rare/special map type** (like a dungeon level) rather than a normal biome roll. Reserved for Phase 2/3.

- Entry via: portal transition, boss arena trigger, or rare objective chain.

---

## Hallway Width

Corridors use **2-3 tiles wide** for readability and movement.

- Generate a 1-tile maze skeleton first.
- **Thicken** corridors by expanding carved cells to neighboring tiles.

---

## Floors as Material Groups

Tile function is decoupled from tile cosmetic skin:

- **Functional terrain:** `walkable`, `movementCost`, `blocksVision`
- **Cosmetic skin:** concrete, cracked stone, grass, mossy-clean variants
- Weather and time of day apply as global modifiers on top.

---

## Biome List

Six confirmed biomes (reference IDEA 3 from WSS -ideas.md):

1. **Lightly Forested Hills** -- Rolling green hills, scattered trees, open spaces, barns, farms, lighthouses, small villas, rivers.
2. **Dense Forest** -- Thick tree coverage, limited visibility, abandoned military compounds, science laboratories, caves, rivers, mountains.
3. **Desert** -- Open sandy/arid landscape, sparse vegetation, gas stations, small downtowns, movie theaters, water towers, cacti, rare oasis, military installations.
4. **Rocky Mountains** -- Elevated rocky terrain, sparse vegetation, sometimes snow, hidden bunker entryway, overgrown roads, wrecks, minimal resources.
5. **City** -- Urban grid, concrete, minimal nature, lots of buildings, hospitals, cracked streets, abandoned police vehicles, fires.
6. **Snow Region** -- Frozen tundra, snow-covered ground, mountains, bunkers, old houses, radio stations, broken satellite arrays, tundra trees.

> TBD -- Exact terrain visual/stat mappings per biome. What tiles are walkable? What tiles are obstacles?

---

## Tile Types & Terrain Costs

> TBD -- Define all tile types (grass, tree, concrete, water, snow, rock, etc.). Movement cost per tile type (grass costs 1, forest costs 2, mountain costs 3?). Vision blocking tiles? Pathing priority?

---

## Structures & Points of Interest

> TBD -- How are structures placed? Pre-designed templates or procedural interiors? Interior layout variation? Multi-story handling? Basement generation? Loot placement strategy? Hidden/rare structures? How many POIs per map?

---

## Biome Mixing (City + Natural)

> TBD -- How do City biomes mix with natural biomes (City + Forest = overgrown ruins, City + Desert = ghost town, City + Snow = frozen metropolis, City + Mountains = cliffside settlement)? Blending rules? Tile transition algorithm?

---

## Map Layout Rules

- Survivors spawn at the center of the map.
- Portal is placed in the center, starts LOCKED.
- Optional center frame maze ring around the hub.
- Spawner placement follows biome theme and difficulty settings.
- Minimum distance between spawners and player start: TBD.
- Corruption Nests spread across the map, biased away from center.
- Objectives distributed to encourage full-map exploration.

---

## Rendering & Performance

- Render only tiles and entities within the current **viewport** (camera frustum).
- Use **near/far plane** concepts (adapted from CS4450 3D rendering) to determine draw priority:
  - **Near plane:** tiles and entities closest to the camera center are drawn at full detail.
  - **Far plane:** tiles at the edge of the viewport can use simplified rendering or be culled.
- Observer Grid UI renders a 2x vision range window around the active survivor group.
- Off-screen entities still simulate but are not drawn.
- With map sizes of 30–60 tiles, viewport culling keeps frame budgets low even with dense maps.

---

## Connection to Other Systems

- **Spawners & Enemies:** Spawner placement tied to biome theme and difficulty (Spawners & Enemies)
- **Fog & Vision:** Biome terrain affects vision blocking and line of sight (Fog & Vision)
- **Combat:** Terrain impacts cover, line of sight, and ranged accuracy (Combat)
- **Resources & Economy:** Loot distribution tied to biome and structure types (Resources & Economy)
- **Day/Night Cycle:** Biome affects day/night visual appearance (Day/Night Cycle)
- **Win Conditions:** Portal location determined during map generation (Win Conditions)
- **Object Model:** CorruptionNest, RiftPortal, and Placeable entities placed during generation (Object Model)

---

## Building Generation

Buildings are generated using a **Stamp Library** system — pre-authored building templates placed procedurally onto the map.

### 3-Phase Pipeline

1. **Macro Layout** — Determine building count and rough zones based on map size, biome, and difficulty. Divide map into sectors to ensure even distribution.
2. **Stamp Placement** — Select templates from the stamp library (weighted by biome), find valid positions (no overlap, valid terrain, minimum spacing), apply random rotation (0/90/180/270).
3. **Interior Dressing** — Randomize props within templates (furniture placement, loot socket filling, ruined variant application) to reduce repetition.

### Stamp Library

Each stamp is a 2D grid pattern defining a building's layout. v0.1 target: 12–20 templates across biomes.

**Stamp Data Model:**
- `id`: unique template identifier
- `name`: human-readable name (e.g., "Farmhouse", "Police Station")
- `size`: (width, height) in tiles
- `biome`: which biomes this stamp can appear in
- `tiles`: 2D array of tile types (WALL, FLOOR, DOOR, WINDOW, FURNITURE, EMPTY)
- `hooks`: embedded gameplay markers
  - `doors`: entry/exit points
  - `lootSockets`: positions where loot can spawn (with loot tier/category)
  - `coverClusters`: groups of tiles with cover values (tables, crates, desks)
  - `spawnPoints`: positions where enemies or NPCs can spawn inside

**Biome Template Categories:**
- **Rural**: farmhouse, barn, shed, gas station, trailer
- **Urban**: apartment, shop, police station, hospital, restaurant
- **Military**: barracks, bunker, watchtower, armory, checkpoint
- **Industrial**: warehouse, factory, storage containers, loading dock

### Placement Rules

- **No overlap**: buildings cannot overlap each other or other placed structures
- **Minimum spacing**: at least 2-3 tiles between buildings for pathability
- **Valid terrain**: buildings only place on valid ground (not water, cliffs, etc.)
- **Biome weighting**: each biome has weighted probabilities for which stamps appear
- **Rotation**: stamps can be rotated 0/90/180/270 degrees for variety
- **Max attempts**: if placement fails after N attempts (e.g., 50), skip that building
- **Density**: building count scales with map size (roughly 1 building per 100-150 tiles of map area)

### Variety Mechanisms

- **Rotation**: 4 orientations per stamp
- **Ruined variants**: each template can have a "destroyed" version with missing walls, rubble, debris
- **Prop randomization**: furniture, containers, and decorations vary between instances of the same template
- **Exterior variation**: same floor plan can have different exterior appearances (color, material, damage level)

### Compound Stamps

Larger locations are built by clustering multiple stamps:
- **Military base**: 3-4 military stamps placed as a group with a fence perimeter
- **Settlement**: cluster of rural/urban stamps around a central area
- **Industrial park**: warehouses + loading docks + storage containers grouped together

### Vehicle & Wreckage Stamps

Small stamps (2x3, 3x3) for environmental objects:
- Crashed cars, overturned trucks, abandoned vehicles
- Provide cover and atmosphere in open areas
- Placed between buildings or along roads

---

## Open Questions

- How many structures per biome? Density scaling by difficulty level?
- Should some structures be locked/require keys to enter?
- Should map generation be deterministic/seeded for testing?
- How much overlap between biome features is allowed?
- Should certain POIs be guaranteed to spawn (at least one hospital, one weapon cache, etc.)?
- Multi-story buildings -- how many floors? How does vertical movement work on a 2D grid?
