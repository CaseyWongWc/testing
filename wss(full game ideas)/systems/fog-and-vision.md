# Fog of War & Vision System

Shared team vision with remembered fog mechanics. Agents see what teammates see, and explored areas are remembered even when out of sight.

**Locked Decision:** Shared team fog with remembered fog (two-step system: visible vs explored).

---

## Overview

The fog system uses two per-tile arrays shared across the entire survivor team. Each tick, `team_visible` is recomputed from all living survivors. Tiles transition between three rendering states based on whether they are currently visible, previously seen, or never explored.

---

## Shared Team Fog Rules

The fog-of-war memory is **shared across the survivor team** (LOCKED decision). A single set of arrays is used for the whole run:

- `team_seen[y][x]` -- boolean, has any survivor ever seen this tile
- `team_visible[y][x]` -- boolean, is this tile currently visible by any living survivor

### Update Rule (Each Tick)

1. Clear `team_visible` to false for all tiles.
2. For each living survivor:
   - Compute tiles within `effective_vision` radius.
   - Mark those tiles as `team_visible = true`.
   - Also set `team_seen = true`.

### Shared Vision Effects

- When any agent sees an enemy, all agents see it.
- When any agent discovers a resource/POI, all agents know about it.
- Vision radius from all agents is combined into a union of visible tiles.

> TBD -- Does shared vision reduce the need for communication, or do agents still use help requests? How does this affect AI decision-making simplicity?

---

## Three Rendering States

- **Visible** (`team_visible = true`): Full brightness, real-time updates. Enemies, items, and terrain shown as they currently are.
- **Remembered / Historical** (`team_seen = true && team_visible = false`): Dimmed/gray/washed out. Shows static terrain snapshot. No live enemy positions. "Last seen enemy" markers may appear here.
- **Unknown** (`team_seen = false`): Completely hidden. No information shown.

---

## Vision Range

### Base Vision

- `base_vision_tiles = 8` (tune later)
- Vision uses **Euclidean distance** for a true circular radius.
- A tile is visible if `distance(tile, survivorPos) <= effective_vision`.

### Vision Formula

```
effective_vision = base_vision * trait_mult * status_mult * timeOfDay_mult
```

### Day/Night Multiplier

- `vision_mult_day = 1.0` (full vision during day)
- `vision_mult_night = 0.7` (reduced to 70% at night)

### Trait Modifiers

- **Scout:** `trait_mult = 2.0` (doubles base vision)
- Other traits: TBD

### Status Modifiers

- **Downed:** Reduces vision (specific multiplier TBD)
- **WellFed:** Increases vision (specific multiplier TBD)

### Vision Bypass Tools

- **Night vision goggles:** Override the night multiplier (or add a flat bonus), effectively giving full vision at night.
- **Weapon range > vision:** Allow firing at targets outside vision if they are previously seen in memory, revealed by teammate vision, or revealed by a "ping" mechanic (future).

---

## "Last Seen Enemy" Markers (Red Pings)

When an enemy leaves the visible area, a marker is placed at its last known position.

### Data Stored (Per Enemy ID)

- `last_seen_pos[enemyId] = (x, y)`
- `last_seen_tick[enemyId] = tick`
- `last_seen_valid[enemyId] = true/false`

### Marker Persistence Rule (LOCKED)

- Markers (red outline / red ping) persist **until the tile becomes visible again**.
- While the tile is in historical fog (`team_seen && !team_visible`), the marker stays.
- When the tile becomes currently visible again, remove the marker (or update to the enemy's current position if the enemy is actually visible).
- If an enemy dies, clear its marker.

### Render Conditions

- Enemy is **not** currently visible, AND
- `last_seen_valid` is true, AND
- Marker age is under optional limit

### Optional Polish Knobs

- `last_seen_fade_seconds` (e.g., fade out after 10-20 seconds)
- Use a "?" variant marker if the enemy has moved a lot since last seen (future)

---

## Phantom Markers (Horror Feature)

For boss hints, scripted sightings, and horror atmosphere. A separate marker type that does not conflict with real tracking.

### PhantomMarker

- `pos`: (x, y)
- `type`: BOSS_HINT, SCREAMER_HINT, etc.
- `created_tick`: tick when placed
- `clear_rule`: UNTIL_TILE_VISIBLE

### Rules

- Phantom markers render on historical fog tiles.
- They clear when the tile becomes currently visible.
- Creates dread without breaking fog-of-war rules.

---

## Line of Sight & Obstacles

> TBD -- What blocks vision?

- Do trees block vision? Partial blocking or full?
- Do buildings/walls block vision through them?
- Do elevated structures give vision advantage (tall towers)?
- Fog/mist tiles? Water? Smoke?
- Can units have "looking around corners" or is it strict line of sight?

> TBD -- How is line of sight calculated? Raycast algorithm? Bresenham? Shadow casting?

---

## Performance Notes

- Only recompute `visible` for tiles in the **bounding box** of the vision radius each tick (not the entire map).
- With 1-5 survivors, this is cheap even at 60 ticks/sec.

---

## Connection to Other Systems

- **AI Brains:** Limited local vision affects agent decision-making (AI Brains)
- **Combat:** Vision determines engagement range and hit chance modifiers (Combat)
- **Map Generation:** Terrain and structures affect line of sight blocking (Map Generation)
- **Day/Night Cycle:** Night reduces vision range via multiplier (Day/Night Cycle)
- **Spawners & Enemies:** Enemy vision may use similar mechanics (Spawners & Enemies)

---

## Open Questions

- Can agents track movement patterns (this zombie walked east 2 rounds ago)?
- How long until a tile is completely forgotten? Never, or decaying memory?
- Should environmental effects (rain, dust storms) reduce vision range?
- How does vision interact with stealth? Can agents hide from shared vision?
- Should destroying lights/torches reduce vision in nearby areas?
- Can agents "look" in specific directions, focusing vision?
