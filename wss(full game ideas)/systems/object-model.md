# Object Model (OOP Class Hierarchy)

Minimum object model for v0.1. Designed to be small and extendable.

---

## World & Map

### Game

- Owns the main loop, tick timing, and run state.
- Manages game state transitions: RUNNING, CUTSCENE, END.
- Holds a reference to World.

### World

- Holds `GridMap`, entity lists (survivors, enemies, items, spawners), and global parameters.
- Provides queries for entities by position, faction, or type.

### GridMap

- 2D array of Tiles.
- Stores map bounds (width, height).
- Helper queries: `getTile(x, y)`, `isWalkable(x, y)`, `getNeighbors(x, y)`.

### Tile

- `terrainType` -- identifier for the terrain (grass, concrete, water, etc.)
- `walkable` -- boolean, can entities walk on this tile
- `movementCost` -- numeric cost for pathfinding (1 = normal, 2 = slow terrain, etc.)
- `coverValue` -- defense bonus from cover (0 = none, 0.25 = half cover, 0.5 = full cover)
- `coverDirection` -- direction the cover faces (NORTH, SOUTH, EAST, WEST), determines which side of the tile provides the cover bonus

---

## Entities

### Entity (Base)

- `id` -- unique identifier
- `position` -- (x, y) on the grid
- `alive` -- boolean
- `update(world)` -- per-tick update method

### Actor (extends Entity)

- `health` -- current / max health
- `stamina` -- current / max stamina (fast recharge, drains hunger/thirst when used)
- `strength` -- physical power, affects melee damage
- `defense` -- damage reduction from incoming attacks
- `speed` -- movement speed in tiles per tick (or ticks per move)
- `accuracy` -- base hit chance modifier for ranged and melee attacks
- `morale` -- psychological state, affects decision-making and flee thresholds
- `faction` -- PLAYER_TEAM | HOSTILE | NEUTRAL (determines friend/foe relationships)
- `sensors` -- vision radius and other perception data

### Survivor (extends Actor)

- `inventory` -- list of held items
- `weapon` -- currently equipped Weapon
- `armor` -- equipped armor piece with `protection` (damage reduction percentage) and `durability` (degrades on hit, breaks at 0)
- `brain` -- Brain implementation (balanced, aggressive, cautious, etc.)

### Zombie (extends Actor)

- Uses simplified brain implementation: seek nearest survivor.
- Uses the same Brain interface as survivors (ZombieBrain).
- No inventory, no weapon equipping, no armor.

### EnemyHumanoid (extends Actor)

Human enemies that use the same combat system as survivors.

- `inventory` -- lootable items on death
- `weapon` -- currently equipped Weapon
- `armor` -- equipped armor piece
- `brain` -- Brain implementation (varies by subtype)
- **Subtypes:**
  - **Bandits** -- opportunistic attackers, target lone survivors, flee when outgunned
  - **Raiders** -- aggressive groups, coordinated attacks, prioritize loot-rich areas
  - **Military Remnants** -- disciplined, use cover and flanking tactics, high accuracy
  - **Scavengers** -- avoid combat, compete for loot, fight only when cornered

### CorruptionNest (extends Entity)

- `nestID` -- unique identifier for the nest
- `position` -- (x, y) on the grid
- `state` -- DORMANT | ACTIVE | DESTROYED
- `spawnRate` -- ticks between spawn attempts
- `maxCapacity` -- maximum living entities spawned from this nest
- `entityPool` -- remaining spawn budget before the nest is exhausted
- `corruptionEnergy` -- resource that fuels spawning, can be drained or destroyed
- `tier` -- SMALL | MEDIUM | LARGE (determines spawn strength and capacity)

### RiftPortal (extends Entity)

- `portalID` -- unique identifier for the portal
- `position` -- (x, y) on the grid
- `state` -- SEALED | OPEN | ACTIVATED
- `objectivesRequired` -- number of objectives needed to unseal the portal
- `objectivesCompleted` -- current count of completed objectives

### Placeable (extends Entity)

Survivor-built objects placed on the map during gameplay.

- `placeableID` -- unique identifier
- `durability` -- hit points before the placeable is destroyed
- `cost` -- resource cost to build (gold, materials, or items)
- `effect` -- gameplay effect when placed (barricade blocks movement, turret attacks enemies, trap damages enemies, etc.)
- `faction` -- which faction owns the placeable (determines friendly fire rules)

---

## AI

### Brain (Interface)

```
decide(actor, world) -> Intent
```

Different Brain implementations produce different behavior:
- BalancedBrain, AggressiveBrain, CautiousBrain, DefensiveBrain (survivors)
- ZombieBrain (enemies -- seek nearest survivor)
- BanditBrain, RaiderBrain, MilitaryBrain, ScavengerBrain (enemy humanoids)

### Intent (Data)

- `type` -- Move | Attack | Loot | Flee | Idle
- `targetPos` -- (x, y) coordinates for movement or positional actions
- `targetEntityId` -- ID of a specific entity for targeted actions

---

## Combat

### Weapon

- `damage` -- base damage per hit
- `range` -- effective range in tiles
- `cooldown` -- ticks between attacks
- `ammo` -- current ammo count (optional for melee weapons)
- `ammoType` -- ammunition category for guns (PistolRounds, ShotgunShells, RifleRounds, etc.)
- `noiseRadius` -- how far the weapon sound travels in tiles (alerts enemies within this radius)
- `durability` -- structural integrity for melee weapons (degrades on use, breaks at 0)

### CombatSystem

- Resolves hit attempts (attacker vs target based on range and weapon stats)
- Manages weapon cooldowns (decrement each tick)
- Processes death (health <= 0 marks entity as dead)

### CoverSystem

- Evaluates cover between attacker and defender positions.
- Checks the defender's tile `coverValue` and `coverDirection` relative to the attacker's position.
- Applies damage reduction or hit chance penalty based on cover quality.
- Cover only applies when the attacker is on the side the cover faces (directional).

### NoiseSystem

- Tracks noise events generated by weapons, explosions, and actions.
- Each noise event has a source position and a `noiseRadius`.
- Alerts all enemies within the noise radius, causing them to investigate the source.
- Louder weapons (guns) attract more enemies than quieter weapons (melee, suppressed).

### ObjectiveSystem

- Manages 6 objective types:
  1. **Kill Target** -- eliminate a specific high-value enemy
  2. **Retrieve Item** -- find and collect a specific item from the map
  3. **Reach Location** -- move a survivor to a designated tile
  4. **Survive Duration** -- keep at least one survivor alive for N ticks
  5. **Destroy Nest** -- destroy a specific CorruptionNest
  6. **Escort NPC** -- protect and guide a neutral NPC to a destination
- Tracks completion state for each objective on the current map.
- When `objectivesCompleted >= objectivesRequired`, unseals the RiftPortal (state -> OPEN).

---

## Items

### Item (extends Entity)

- `type` -- HealthPack | Ammo | Armor | MeleeWeapon | Gun | Consumable
- `effect` -- what happens on pickup or use
- **Consumable subtypes:**
  - **Bandage** -- heals a small amount of health over time
  - **Medkit** -- heals a large amount of health instantly
  - **Molotov** -- throwable, creates a fire area dealing damage over time
  - **Stim** -- temporary stat boost (speed, accuracy, etc.)
  - **Ration** -- restores hunger/thirst, fuels stamina regeneration

Can also be implemented as a simple struct/data object if full Entity overhead is unnecessary.

### PickupSystem

- Handles item pickup when a survivor steps onto an item tile.
- Applies the item's effect to the survivor.
- Removes the item from the world.

---

## Rendering

### SpriteComposer / EntityRenderer

Modular sprite system for humanoid entities (survivors, enemy humanoids, zombies). Renders entities by compositing 5 layers in order:

1. **Body** -- base humanoid sprite (faction/type-specific skin)
2. **Head** -- head sprite (helmets, hats, hair variations)
3. **Armor Overlay** -- equipped armor piece rendered on top of body
4. **Arms + Weapon** -- arm position and held weapon sprite (changes based on equipped weapon)
5. **Status Indicators** -- health bar, status effect icons (poisoned, bleeding, buffed), faction indicator

Each layer is independently swappable, allowing visual variety without unique full-body sprites for every combination.

---

## Spawning

### Spawner (extends Entity)

- `spawnCooldown` -- ticks between spawn attempts
- `maxAliveFromThisSpawner` -- cap on living enemies from this spawner
- `spawnType` -- which enemy type to produce
- Resource pool for spawn capacity (beehive honey concept)

---

## Pathfinding

### Pathfinder

- Implements A* or weighted BFS over `GridMap`.
- Takes into account `Tile.walkable` and `Tile.movementCost`.
- Survivors use pathfinding for movement intents.
- Enemies use pathfinding to navigate toward targets.
