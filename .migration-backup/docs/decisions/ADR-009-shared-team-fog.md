# ADR-009: Shared Team Fog of War

## Status: Accepted
## Date: February 2026

## Context
Need a fog-of-war system. Options: per-agent fog (each agent sees independently) or shared team fog (team shares vision).

## Decision
Use **shared team fog** with **remembered fog** (two-step: visible vs explored).

## Details
- Two per-tile arrays shared across the survivor team:
  - `team_seen[y][x]` — has any survivor ever seen this tile
  - `team_visible[y][x]` — is this tile currently visible by any living survivor
- Each tick: clear team_visible, recompute from all living survivors' vision radii
- Three rendering states: Visible (full brightness), Remembered (dimmed), Unknown (hidden)
- Vision uses Euclidean distance for circular radius
- Base vision: 8 tiles, modified by traits, status, time of day, weapon bonuses
- "Last seen enemy" markers persist until the tile becomes visible again

## Consequences
- When any agent sees an enemy, all agents see it
- Fog computation is cheap (only check tiles in bounding box of each survivor's vision)
- Remembered fog shows static terrain snapshot, no live enemy positions
- Vision formula: effective_vision = base * trait_mult * status_mult * timeOfDay_mult + weapon_bonus + item_bonus

## Dependencies
- Requires: GridMap (Phase 0), Entity system (Phase 0)
- Implementation: Phase 1
