# Map Generation System

Procedural generation of themed biome maps with semi-randomized structures, terrain types, and points of interest.

---

## Overview

> TBD — How does the generation algorithm work? Noise-based? Room-based? Tile-based? Should it be seeded for reproducibility? How much control over density/pacing?

---

## Grid Structure

> TBD — What is the map grid size (50x50? 100x100? configurable)? Tile format (square grid only, or hexagonal)? How many layers (floors, sublevels)? Coordinate system and pathing resolution.

---

## Biome List

Six confirmed biomes (reference IDEA 3 from WSS -ideas.md):

1. **Lightly Forested Hills** — Rolling green hills, scattered trees, open spaces, barns, farms, lighthouses, small villas, rivers.
2. **Dense Forest** — Thick tree coverage, limited visibility, abandoned military compounds, science laboratories, caves, rivers, mountains.
3. **Desert** — Open sandy/arid landscape, sparse vegetation, gas stations, small downtowns, movie theaters, water towers, cacti, rare oasis, military installations.
4. **Rocky Mountains** — Elevated rocky terrain, sparse vegetation, sometimes snow, hidden bunker entryway, overgrown roads, wrecks, minimal resources.
5. **City** — Urban grid, concrete, minimal nature, lots of buildings, hospitals, cracked streets, abandoned police vehicles, fires.
6. **Snow Region** — Frozen tundra, snow-covered ground, mountains, bunkers, old houses, radio stations, broken satellite arrays, tundra trees.

> TBD — Exact terrain visual/stat mappings per biome. What tiles are walkable? What tiles are obstacles?

---

## Tile Types & Terrain Costs

> TBD — Define all tile types (grass, tree, concrete, water, snow, rock, etc.). Movement cost per tile type (grass costs 1, forest costs 2, mountain costs 3?). Vision blocking tiles? Pathing priority?

---

## Structures & Points of Interest

> TBD — How are structures placed? Pre-designed templates or procedural interiors? Interior layout variation? Multi-story handling? Basement generation? Loot placement strategy? Hidden/rare structures? How many POIs per map?

---

## Biome Mixing (City + Natural)

> TBD — How do City biomes mix with natural biomes (City + Forest = overgrown ruins, City + Desert = ghost town, City + Snow = frozen metropolis, City + Mountains = cliffside settlement)? Blending rules? Tile transition algorithm?

---

## Map Layout Rules

> TBD — Are there mandatory zones (start, portal location, spawner zones)? Safe zones vs danger zones? Onslaught zone boundaries? How much of the map is explored vs hidden at game start? Minimum distance between spawners and player start?

---

## Connection to Other Systems

- **Spawners & Enemies:** Spawner placement tied to biome theme and difficulty (Spawners & Enemies)
- **Fog & Vision:** Biome terrain affects vision blocking and line of sight (Fog & Vision)
- **Combat:** Terrain impacts cover, line of sight, and ranged accuracy (Combat)
- **Resources & Economy:** Loot distribution tied to biome and structure types (Resources & Economy)
- **Day/Night Cycle:** Biome affects day/night visual appearance (Day/Night Cycle)
- **Win Conditions:** Portal location determined during map generation (Win Conditions)

---

## Open Questions

- Should maps have a defined "safe zone" away from spawners?
- How many structures per biome? Density scaling by difficulty level?
- Should some structures be locked/require keys to enter?
- Can maps be smaller for early waves and larger for later waves?
- Should map generation be deterministic/seeded for testing?
- How much overlap between biome features is allowed?
- Should certain POIs be guaranteed to spawn (at least one hospital, one weapon cache, etc.)?
- Multi-story buildings — how many floors? How does vertical movement work on a 2D grid?
