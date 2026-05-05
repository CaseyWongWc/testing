# Spawners & Enemies System

Enemy spawning mechanics, map exit portals, player-built placeables, and enemy roster. Enemies escalate in difficulty through Corruption Nest tiers and Director-driven events.

---

## Overview

This document covers everything that gets placed or spawned on the map beyond terrain and structures. There are three major categories:

1. **Rift Portals** -- exit goals that survivors must reach to evacuate to the next map.
2. **Corruption Nests** -- physical spawner objects that produce enemies using a resource pool pattern.
3. **Placeables** -- survivor-built objects like barricades, traps, and campfires.

Spawners (Corruption Nests) run continuously during the tick loop, checking cooldowns and alive counts each tick. They use a resource pool system adapted from the beehive simulation (Scene 8).

---

## Rift Portals (Exit Goals)

**CRITICAL: Rift Portals are NOT enemy spawners. They are the exit goal -- the way survivors evacuate to the next map.**

### Portal States

- **SEALED** -- Default state. The portal is visible but cannot be entered. Survivors must complete map objectives to unseal it.
- **OPEN** -- Objectives completed. Survivors can now enter the portal.
- **ACTIVATED** -- A survivor has entered the portal, triggering evacuation to the next map.

### Properties

- `portalID` -- unique identifier
- `position` -- grid coordinates
- `state` -- SEALED | OPEN | ACTIVATED
- `objectivesRequired` -- list of objectives that must be completed to unseal
- `objectivesCompleted` -- list of objectives currently completed

### Placement

- Typically placed at the center or a specific predetermined location on the map.
- Often surrounded by enemies or Corruption Nests, making the approach dangerous.
- Only one Rift Portal per map (standard). Special map types may vary.

### Guard Mechanics

- Corruption Nests are frequently placed near the Rift Portal, forcing survivors to fight through enemies to reach it.
- The Director may intensify spawning near the portal as survivors approach.
- Destroying nearby nests can be one of the objectives required to unseal the portal.

---

## Corruption Nests (Enemy Spawners)

Corruption Nests are physical hive-like objects on the grid that produce enemies. They replace the earlier concept of generic spawners and are adapted from the beehive simulation pattern (Scene 8).

### Properties

- `nestID` -- unique identifier
- `position` -- grid coordinates
- `state` -- DORMANT | ACTIVE | DESTROYED
- `spawnRate` -- ticks between spawn attempts
- `maxCapacity` -- cap on how many living enemies this nest can have at once
- `entityPool` -- weighted random table of enemy types this nest can produce
- `corruptionEnergy` -- resource pool that fuels spawning (refills over time, spawning costs energy)

### Nest Tiers

| Tier | Enemies Produced | Spawn Rate | Max Capacity | Notes |
|------|-----------------|------------|--------------|-------|
| Small | Weak enemies (basic zombies) | Low | 3-5 | Common, scattered across map |
| Medium | Mixed enemies (zombies + runners) | Moderate | 6-10 | Mid-map, near points of interest |
| Large | Strong enemies (tanks, spitters, elites) | High | 10-15 | Rare, guard key objectives or portal |

### Nest Destruction

- Survivors can attack and destroy Corruption Nests.
- Destroying a nest permanently stops its spawning.
- Destroying nests can be a map objective type (e.g., "Destroy 3 Corruption Nests to unseal the Rift Portal").
- Destroyed nests may drop loot or resources.

### Resource Pool Mechanics

Each nest has a corruptionEnergy pool that determines spawn capacity (adapted from beehive honey):

- Pool refills at a configurable rate (per tick or per second).
- Spawning costs energy points from the pool.
- Different enemy types cost different amounts of energy (basic zombie = 1, runner = 3, tank = 10, boss = 50).
- Pool size and refill rate can increase with difficulty/waves and nest tier.

---

## Placeables

Placeables are a separate class from spawners. They are objects deliberately built by survivors rather than entities that produce other entities automatically.

### Properties

- `placeableID` -- unique identifier
- `position` -- grid coordinates
- `durability` -- health points; placeables degrade over time or when attacked
- `cost` -- resources required to build
- `effect` -- gameplay effect (blocks movement, deals damage, heals, stores items)
- `faction` -- which faction placed it (survivor team)

### Placeable Types

- **Barricade** -- blocks enemy movement, has durability, can be destroyed by enemies
- **Trap** -- deals damage to enemies that step on it, single-use or limited uses
- **Campfire** -- provides healing or morale boost in an area, consumes fuel
- **Storage Cache** -- allows survivors to store and share items at a location

### Key Distinction

Spawners (Corruption Nests) produce entities automatically on a tick loop. Placeables are deliberately built by survivor actions and do not produce entities. They serve defensive, utility, or support roles.

---

## Spawner Methods (How Spawners Appear on the Map)

Four methods by which spawners and spawn-like objects enter the game:

### 1. Pregenerated

Placed during map generation. Fixed positions determined by the map gen algorithm.

- Corruption Nests (all tiers)
- Water towers (resource spawners)
- Berry bushes, animal dens

### 2. Natural/Organic

Emerges during gameplay through environmental systems.

- Corruption Nests grow from small to medium to large over time
- Mushroom patches spread to adjacent tiles
- Animal populations reproduce

### 3. By Area (Location-Triggered)

Activated when a survivor enters a specific area.

- Entering a building activates dormant enemies inside
- Approaching a point of interest triggers a nest to wake up
- Crossing a boundary spawns an ambush

### 4. By Event (Director/System-Triggered)

Triggered by the Director system or game events.

- Night falls → nocturnal spawners activate
- Director triggers a pressure wave → temporary spawn points appear at map edges
- Objective completed → new nests appear as a consequence
- Time threshold reached → nest tier upgrades

---

## Spawner Lifecycle State Machine

Spawners can appear and disappear dynamically during gameplay.

```
NONEXISTENT → APPEARING → ACTIVE → DORMANT → DISAPPEARING → NONEXISTENT
                            ↓
                         DESTROYED
```

### States

- **NONEXISTENT** -- Not on the map. Default state before spawner appears.
- **APPEARING** -- Spawner is materializing (visual effect, brief delay before functional).
- **ACTIVE** -- Spawner is producing enemies on its tick loop.
- **DORMANT** -- Spawner exists but is not currently producing enemies (area-triggered spawners wait here until activated, or the Director pauses them during calm periods).
- **DISAPPEARING** -- Spawner is fading out (temporary spawners expire, event spawners wind down).
- **DESTROYED** -- Spawner was destroyed by survivor action. Terminal state.

---

## Cap System

### Capped Spawners

Most spawners enforce a `maxCapacity` limit. When the number of living enemies produced by a nest reaches its cap, the nest stops spawning until some of its enemies are killed.

### Uncapped Spawners

Rare and dramatic. No limit on how many enemies they produce. Used for special events like final wave assaults or boss encounters. The Director controls these directly.

### Global Safety Cap

A hard engine-level limit on total enemies on the map at once to prevent performance issues. When the global cap is reached, all spawners pause regardless of individual capacity.

---

## Permanence Categories

### Permanent

Never disappear once placed. Persist for the entire map duration.

- Water towers
- Berry bushes
- Animal dens

### Temporary

Auto-expire after a set duration or condition is met.

- Event horde spawn points (Director pressure waves)
- Swarm mounds (short burst of enemies, then gone)
- Supply drop beacons (deliver supplies, then disappear)

### Semi-Permanent

Persist on the map but can be depleted, destroyed, or killed.

- Traders (can be killed by enemies or leave after time)
- Scrap piles (deplete as survivors loot them)
- Cisterns (water source that can run dry)

---

## What Spawns What (Master List)

### Map Generation Spawns

- Terrain tiles and biomes
- Structures (buildings, walls, ruins)
- Static loot containers
- Rift Portal (exit goal)
- Trader NPCs
- Objective markers
- Survivor start positions
- Pregenerated Corruption Nests

### Corruption Nests Spawn

- Basic zombies
- Zombie variants by tier (runners, tanks, spitters, screamers)
- Wandering enemies (patrol routes away from nest)

### Director System Spawns

- Event waves (enemies arriving from map edges)
- Nest tier upgrades (small → medium → large)
- Resource respawning (replenish depleted resource nodes)

### Player Actions Spawn

- Barricades
- Traps
- Campfires
- Storage caches

---

## Enemy Base Class

Zombie extends Actor (which extends Entity):

- Has a simple brain: seek nearest survivor.
- Uses the same Brain interface as survivors: `decide(actor, world) -> Intent`
- Zombie brains typically return Move (toward nearest survivor) or Attack (if in range).

---

## Enemy Type Roster

### Zombie Types

- **Basic Zombie** -- Slow, melee only, standard health/damage. Produced by all nest tiers.
- **Runner** -- Fast, weak armor, higher threat due to speed. Produced by Medium+ nests.
- **Tank** -- Slow, high health/armor, high damage. Produced by Large nests.
- **Spitter/Ranged** -- Medium speed, ranged attack, special abilities. Produced by Medium+ nests.
- **Screamer/Alert** -- Calls for reinforcements when damaged, can wake dormant nests. Produced by Medium+ nests.
- **Boss Zombie** -- Unique, rare, high threat. Produced by Large nests or Director events.

### Enemy Humanoid Survivors

Enemy humans who use the same combat system as friendly survivors. They have the same Actor base class and Brain interface but are hostile.

- **Bandits** -- Small groups, low-tier gear, opportunistic attacks.
- **Raiders** -- Organized groups, moderate gear, will assault survivor camps.
- **Military Remnants** -- Well-armed, tactical behavior, rare and dangerous.
- **Scavengers** -- Solo or pairs, avoid direct combat, steal resources and flee.

---

## Loot Distribution

**OPEN/TBD** -- How loot spawns and distributes across the map has not yet been decided. Key questions:

- Do enemies drop loot on death?
- Are loot containers pregenerated or dynamically placed?
- Does the Director influence loot availability?
- How does loot scale with difficulty?
- Is loot shared or individual per survivor?

---

## Wave Escalation & Difficulty Scaling (DECISION 7 - DECIDED)

**Hybrid system: Base difficulty selection + adaptive scaling layer.**

### Base Difficulty (from WSS1)

Selectable at game start, carries over from WSS1's difficulty dropdown (Easy/Medium/Hard/Very Hard). Sets initial Corruption Nest density, enemy health, and resource availability.

### Adaptive Scaling Layer

On top of the base difficulty, Corruption Nest behavior adjusts dynamically based on:

- **Survivor health/resources** -- Doing well = nests spawn faster
- **Time survived** -- Escalation over turns
- **Nests destroyed** -- Clearing nests slows spawns, but remaining ones intensify and may tier up
- **Kill count** -- High kills = tougher enemy types unlock in nest entity pools

### Adaptive Parameters

- **Spawn rate multiplier** -- 0.5x to 2.0x of base rate
- **Enemy type tier** -- Basic zombies → runners/spitters → tanks/bosses (unlocks based on performance)
- **Resource scarcity** -- Fewer items spawn on map when survivors are resource-rich (market inventory stays independent)
- **Nest tier escalation** -- Small nests can grow to Medium, Medium to Large over time

### Director System (Left 4 Dead-inspired)

A "Director" AI tracks a **tension metric** and orchestrates the pacing:

- Alternates between **pressure waves** (intense spawning, temporary edge spawners) and **calm periods** (nests slow down, breathing room)
- Prevents both tedium (too easy for too long) and overwhelming difficulty (nonstop pressure)
- Tension resets to zero when entering **Survivor Market** between maps
- **Day/Night cycle** feeds into tension -- nighttime naturally ramps tension and activates nocturnal spawners, daytime is a built-in calm window
- Director can trigger nest tier upgrades, activate dormant nests, or spawn event waves from map edges

---

## Connection to Other Systems

- **Combat** -- Enemy combat stats tied to Combat system. Enemy humanoid survivors use the same combat mechanics as friendly survivors.
- **AI Brains** -- Enemy AI decision-making uses the Brain interface. Zombie brains are simple (seek and attack). Humanoid enemy brains are more complex (tactical, flee when low).
- **Map Generation** -- Corruption Nest placement and Rift Portal placement tied to biome and difficulty. Pregenerated spawners placed during map gen.
- **Fog & Vision** -- Corruption Nests may spawn enemies regardless of fog state, but nest visibility follows fog rules.
- **Resources & Economy** -- Enemies may drop loot/resources. Placeables cost resources to build. Nests consume corruptionEnergy.
- **Win Conditions** -- Reaching and activating the Rift Portal is the primary win condition. Destroying nests and enemy kills contribute to extraction score.
- **Day/Night Cycle** -- Night activates nocturnal spawners and increases nest spawn rates. Day provides calm windows.

---

## Open Questions

- How does loot distribution work across the map? (See Loot Distribution section)
- Should zombie types appear randomly from nests or follow a specific unlock pattern based on nest tier?
- Should different nest tiers appear on different biomes?
- Can nests be hacked or corrupted by survivors to fight for them, or only destroyed?
- Should nests have visual indicators showing their tier and activity state?
- What is the global enemy cap number for performance?
- Can enemy humanoid survivors be recruited or negotiated with?
- Can enemy pathfinding improve over time (learning)?
- How do Corruption Nests interact with the fog system -- do they spawn enemies in fog or only in visible areas?
- What visual effects accompany nest state transitions (APPEARING, DISAPPEARING, DESTROYED)?
- How many nests per map on each difficulty level?
- Do nests have any passive effects on nearby tiles (corruption spread, debuffs)?
