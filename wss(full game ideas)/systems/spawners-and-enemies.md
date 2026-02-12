# Spawners & Enemies System

Zombie and enemy spawning mechanics using resource pool-based spawners. Enemies escalate in difficulty over waves.

---

## Overview

> TBD — How do spawners work in real-time? Continuous spawning or wave-based? Do multiple spawners exist on one map? How visible are spawners to players (see the rift or hidden)?

---

## Spawner Types

Three types of spawners (reuse beehive spawner concept from Scene 3):

- **Horde Spawner:** Fast spawning rate, weak enemies, resource pool depletes quickly.
- **Elite Spawner:** Slow spawning rate, strong enemies, resource pool depletes slowly.
- **Boss Spawner:** Rare, spawns single powerful boss enemy, one-time or repeatable?

> TBD — How many spawners per map? Fixed locations or randomized? Can spawners migrate/relocate?

---

## Spawner Mechanics (Resource Pool)

> TBD — Beehive concept implementation:

- Each spawner has a resource pool (like honey in the beehive simulation).
- Pool refills at configurable rate (per second/round).
- Spawning costs resource points from the pool.
- Pool size can increase with difficulty/waves.
- Can spawners overflow (max pool cap or unbounded)?

> TBD — Do different enemy types cost different amounts of resources? (Weak zombie = 1 point, strong runner = 3 points, boss = 50 points?)

---

## Enemy Type Roster

> TBD — Define all zombie/enemy types that spawn:

- **Basic Zombie:** Slow, melee only, standard health/damage.
- **Runner:** Fast, weak armor, higher threat due to speed.
- **Tank:** Slow, high health/armor, high damage.
- **Spitter/Ranged:** Medium speed, ranged attack, special abilities.
- **Screamer/Alert:** Calls for reinforcements when damaged?
- **Boss Zombie:** Unique, rare, high threat.
- **[Other types TBD]**

> TBD — Do zombie types have stat variations (tiers, mutations)?

---

## Wave Escalation & Difficulty Scaling

> TBD — How do enemies get stronger over time?

- Do waves have defined difficulty thresholds?
- Resource pool increases per wave?
- New enemy types unlock at higher waves?
- Boss spawner activation criteria (wave X, score threshold)?
- Escalation formula/curve — linear, exponential, step-based?

---

## Spawner Destruction

> TBD — Can agents destroy spawners? How?

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
- **AI Brains:** Enemy AI decision-making (may use similar trees) (AI Brains)
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
