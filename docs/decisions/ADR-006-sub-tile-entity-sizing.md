# ADR-006: Sub-Tile Entity Sizing

## Status: Accepted
## Date: February 2026

## Context
Need to decide whether entities occupy full tiles or can be smaller than tiles. Affects collision, rendering, and how many entities can coexist in the same space.

## Decision
Entities use **sub-tile sizing** — entities are smaller than grid tiles.

## Details
- Entity radius: 0.3-0.4 tiles (configurable per entity type)
- Position stored as float coordinates (x: 23.4, y: 17.8)
- Current tile tracked as floor(x), floor(y) for grid-based logic
- Multiple entities can occupy the same tile
- Collision detection uses float positions and entity radii
- Rendering: sprites scaled to ~60-80% of tile size for visual clarity

## Consequences
- Grid-based queries (pathfinding, fog) use integer tile coords
- Entity-based queries (combat range, collision) use float Euclidean distance
- Map sizes stay manageable (30-60 tiles) since entities don't need 1:1 tile occupancy
- Supports the hybrid movement model (ADR-002)

## Dependencies
- Requires: Entity system (Phase 0)
- Enables: Combat range checks (Phase 1), group combat on same tile (Phase 1)
