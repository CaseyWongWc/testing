# Spawners & Enemies System

Zombie and enemy spawning mechanics using resource pool-based spawners. Enemies escalate in difficulty over waves.

---

## Overview

Spawners are entities placed on the map that produce enemies on a cooldown. Each spawner has a resource pool (like the beehive honey concept) that determines spawn capacity. Spawners run continuously during the tick loop, checking cooldowns and alive counts each tick.

---

## Spawner Entity

A Spawner extends Entity with the following properties:

- `spawnCooldown` -- ticks between spawn attempts
- `maxAliveFromThisSpawner` -- cap on how many living enemies this spawner can have at once
- `spawnType` -- which enemy type this spawner produces

---

## Spawner Types

Three categories of spawners (reuse beehive spawner concept from Scene 3):

- **Horde Spawner:** Fast spawning rate, produces weak enemies, resource pool depletes quickly.
- **Elite Spawner:** Slow spawning rate, produces strong enemies, resource pool depletes slowly.
- **Boss Portal:** Rare, spawns a single powerful boss enemy. One-time or repeatable TBD.

> TBD -- How many spawners per map? Fixed locations or randomized? Can spawners migrate/relocate?

---

## Spawner Mechanics (Resource Pool)

Each spawner has a resource pool that determines spawn capacity (like honey in the beehive simulation):

- Pool refills at a configurable rate (per tick or per second).
- Spawning costs resource points from the pool.
- Pool size can increase with difficulty/waves.

> TBD -- Can spawners overflow (max pool cap or unbounded)? Do different enemy types cost different amounts of resources? (Weak zombie = 1 point, strong runner = 3 points, boss = 50 points?)

---

## Enemy Base Class

Zombie extends Actor (which extends Entity):

- Has a simple brain: seek nearest survivor.
- Uses the same Brain interface as survivors: `decide(actor, world) -> Intent`
- Zombie brains typically return Move (toward nearest survivor) or Attack (if in range).

---

## Enemy Type Roster

> TBD -- Full enemy roster is still to be determined, but categories are established:

- **Basic Zombie:** Slow, melee only, standard health/damage.
- **Runner:** Fast, weak armor, higher threat due to speed.
- **Tank:** Slow, high health/armor, high damage.
- **Spitter/Ranged:** Medium speed, ranged attack, special abilities.
- **Screamer/Alert:** Calls for reinforcements when damaged?
- **Boss Zombie:** Unique, rare, high threat.
- **[Other types TBD]**

> TBD -- Do zombie types have stat variations (tiers, mutations)?

---

## Wave Escalation & Difficulty Scaling (DECISION 7 - DECIDED)

**Hybrid system: Base difficulty selection + adaptive scaling layer.**

### Base Difficulty (from WSS1)

Selectable at game start, carries over from WSS1's difficulty dropdown (Easy/Medium/Hard/Very Hard). Sets initial spawn rates, enemy health, and resource availability.

### Adaptive Scaling Layer

On top of the base difficulty, spawner behavior adjusts dynamically based on:

- **Survivor health/resources:** Doing well = more spawns
- **Time survived:** Escalation over turns
- **Portals destroyed:** Clearing portals slows spawns, but remaining ones intensify
- **Kill count:** High kills = tougher enemy types

### Adaptive Parameters

- **Spawn rate multiplier:** 0.5x to 2.0x of base rate
- **Enemy type tier:** Basic zombies -> armored -> special (unlocks based on performance)
- **Resource scarcity:** Fewer items spawn on map when survivors are resource-rich (market inventory stays independent)

### Director System (Left 4 Dead-inspired)

A "Director" AI tracks a **tension metric** and orchestrates the pacing:

- Alternates between **pressure waves** (intense spawning) and **calm periods** (breathing room)
- Prevents both tedium (too easy for too long) and overwhelming difficulty (nonstop pressure)
- Tension resets to zero when entering **Survivor Market** between maps
- **Day/Night cycle** feeds into tension -- nighttime naturally ramps tension, daytime is a built-in calm window

> TBD -- Exact tension thresholds, calm period duration, pressure wave intensity curves

---

## Spawner Destruction

> TBD -- Can agents destroy spawners? How?

- Melee attack? Ranged only? Special ability?
- How much health does a spawner have?
- Does destroying a spawner:
  - Stop all spawning permanently?
  - Reduce incoming waves?
  - Give bonus score (IDEA 3 extraction score)?
- Can spawners regenerate or are they permanently destroyed?

---

## Connection to Other Systems

- **Combat:** Enemy combat stats tied to Combat system (Combat)
- **AI Brains:** Enemy AI decision-making uses the Brain interface (AI Brains)
- **Map Generation:** Spawner placement tied to biome and difficulty (Map Generation)
- **Fog & Vision:** Enemies spawn within visible/remembered fog or hidden? (Fog & Vision)
- **Resources & Economy:** Enemies may drop loot/resources (Resources & Economy)
- **Win Conditions:** Enemy kills contribute to extraction score (Win Conditions)

---

## Open Questions

- Should zombie types appear randomly or follow a specific unlock pattern?
- Do zombies drop resources/loot when killed?
- Should different spawner types appear on different biomes?
- Can spawners be controlled/hacked by agents or only destroyed?
- Should spawners have visual indicators (glowing rifts? particle effects?)?
- How many total enemies can exist on map at once (cap)?
- What happens when an agent dies near a spawner (respawn nearby)?
- Can enemy pathfinding improve over time (learning)?
- Should special event waves occur (sudden elite spawn, boss arrival)?
- Do spawner locations change between map visits or stay consistent?
