# ADR-002: Hybrid Movement Model (Grid + Smooth)

## Status: Accepted
## Date: February 2026

## Context
Need a movement system that supports both AI pathfinding (needs discrete grid) and visually smooth entity movement (needs float positions).

## Decision
Use a **hybrid model**: grid-based world for AI logic, smooth float-position movement for entities on top.

## Details
- World is a 2D grid of tiles (30x30 to 60x60)
- Entities store position as float coordinates (x: 23.4, y: 17.8)
- Entities also track their current tile via floor(x), floor(y)
- AI pathfinds on the grid (A* uses integer tile coords)
- Entity movement interpolates smoothly between tiles
- Multiple entities can occupy the same tile (sub-tile sizing, radius 0.3-0.4)
- All distance checks use float Euclidean distance

## Consequences
- Grid queries (getTile, isWalkable) use integer coords
- Entity queries (getEntitiesInRadius) use float coords
- Collision detection uses float positions and entity radii
- Renderer must convert float world positions to screen pixels via Camera

## Dependencies
- Requires: GridMap (Phase 0), Entity system (Phase 0)
- Enables: Pathfinding (Phase 1), Combat range checks (Phase 1)
