# Experience Log: Radioactive Survival v1.6 (Rusted Warfare Mod)

**Date:** February 24, 2026
**Observer:** Casey Wong (via phone capture session)
**Source:** Radioactive Survival v1.6 "The A-Life Update" by BTDbu (@Btdbu / Radiorum) — total conversion mod for Rusted Warfare
**Inspired by:** S.T.A.L.K.E.R., Fallout, Escape from Tarkov

---

## What It Is

A post-apocalyptic isometric survival RPG built entirely within Rusted Warfare's RTS engine. The "A-Life Update" (v1.6) adds autonomous NPC behavior — NPCs exist and act independently in the game world, pursuing their own goals, traveling, and fighting regardless of player proximity.

---

## Key Observations

### 1. A-Life NPC Autonomy
**What was observed:** After placing 2 NPCs (1 male, 1 female) in the editor and starting the game, AI immediately made different pathfinding choices. Each character chose their own direction and objectives without any player input.

**WSS2 Implication:** Validates our zero-player Brain/Vision architecture. Our system goes further — we have 5 distinct personality types (Balanced, Aggressive, Cautious, Survivalist, Money-Driven) that should produce even more varied autonomous behavior than what Radioactive Survival achieves. Key difference: their NPCs react to the world; our survivors reason about it.

### 2. Scale Model: 1x1 Tiles with Huge Maps
**What was observed:** Radioactive Survival uses tiny tiles (roughly 1:1 with entity size) on very large maps. This creates fine-grained terrain detail but requires a powerful native engine (Rusted Warfare's multi-threaded C++) to handle pathfinding and rendering across thousands of tiles.

**WSS2 Implication:** Confirms our decision to use the opposite approach — big tiles with sub-tile entities on 30-60 tile maps. Our browser-based tech stack (React/Canvas/JS at 60 tps) cannot handle thousands of tiles efficiently. We achieve visual detail through the Stamp Library + Dressing Pass system instead of tile granularity. Both approaches work; ours is better suited to our platform.

**Deprecated consideration:** Large-map rendering optimizations (lazy loading, near/far plane rendering from graphics class) were considered but are unnecessary at our 30-60 tile scale. Viewport culling of the Observer Grid is sufficient.

### 3. Fog of War / Vision Cones
**What was observed:** Nighttime scenes showed visible line-of-sight indicators on units — you could see exactly what each NPC could perceive. Clear visual distinction between lit/visible areas and fog.

**WSS2 Implication:** Consider adding optional vision cone/circle rendering in Observer mode. When spectating a specific survivor, show their effective vision radius as a subtle overlay. This directly supports our "Observable AI Behavior" product goal — the Observer can see not just what the agent does, but what it can perceive. Pairs well with our existing shared team fog system (ADR fog-and-vision.md).

### 4. Combat Stats Display
**What was observed:** Unit tooltip showed: HP:440, Shield:100, Speed:1, Temperature:36°C, multiple attack values with different ranges. Clean, information-dense but readable.

**WSS2 Implication:** Good reference for our Observer Grid's survivor info panel. When clicking/hovering a survivor, show: HP, armor, equipped weapon, ammo count, hunger/thirst, current brain intent. Keep it compact like their tooltip rather than a full-screen overlay.

### 5. Editor / Entity Spawning UX
**What was observed:** "Search units" dialog for spawning entities by name, action palette with Add/Delete/Clone/Reload commands, patrol and guard command modes.

**WSS2 Implication:** Reference for our pre-game configuration screen. The search-and-spawn pattern could inform how we let players pick survivor brains, starting loadouts, and map parameters. Not a priority for Phase 0 but good to keep in mind for UI polish (Phase 3-4).

### 6. Solo Developer Scope Validation
**What was observed:** BTDbu is a solo developer who transformed an entire RTS engine into a survival RPG. The mod has a dedicated following and continuous updates.

**WSS2 Implication:** Validates that our scope — building a survival horror sim on top of WSS components with a two-person team — is achievable with disciplined iteration and locked sprint scope. Their mod evolved over many versions; our phased roadmap (Phase 0-4) follows the same pattern.

---

## Key Differences from WSS2

| Aspect | Radioactive Survival | WSS2 |
|--------|---------------------|------|
| Perspective | Player-controlled character | Zero-player Observer |
| AI depth | A-Life reactive behavior | Brain/Vision modular architecture with 5 personality types |
| Engine | Native C++ RTS (handles 1000s of units) | Browser-based React/Canvas (optimized for 30-60 tile maps) |
| Tile scale | 1:1 entity-to-tile | Sub-tile (entities ~1/3 of tile) |
| Map size | Hundreds/thousands of tiles | 30-60 tiles per side |
| Combat | EFT-style body-part damage | Real-time 60tps with 3 weapon classes, noise mechanic |
| Multiplayer | Cross-platform multiplayer | Single-observer, AI-only agents |

---

## What to Steal

- A-Life philosophy of truly autonomous NPCs
- Vision cone/radius rendering for observability
- Compact stat tooltip design for Observer Grid
- Search-and-spawn editor UX pattern

## What NOT to Copy

- 1x1 tiny tile scale (too expensive for browser)
- Player-controlled combat (we're zero-player)
- Massive map sizes (unnecessary at our scale)

---

## Added to Reference List

Radioactive Survival joins: Dinogen Online, Darkwood, Project Zomboid, COD Cold War Zombies: Onslaught as reference games for WSS2 design.
