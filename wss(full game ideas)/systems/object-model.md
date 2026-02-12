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
- `coverValue` -- future use, defense bonus from cover (TBD)

---

## Entities

### Entity (Base)

- `id` -- unique identifier
- `position` -- (x, y) on the grid
- `alive` -- boolean
- `update(world)` -- per-tick update method

### Actor (extends Entity)

- `health` -- current / max health
- `speed` -- movement speed in tiles per tick (or ticks per move)
- `faction` -- SURVIVOR | ZOMBIE | NEUTRAL (determines friend/foe)
- `sensors` -- vision radius and other perception data

### Survivor (extends Actor)

- `inventory` -- list of held items
- `weapon` -- currently equipped Weapon
- `brain` -- Brain implementation (balanced, aggressive, cautious, etc.)

### Zombie (extends Actor)

- Simple brain implementation: seek nearest survivor.
- Uses the same Brain interface as survivors.

---

## AI

### Brain (Interface)

```
decide(actor, world) -> Intent
```

Different Brain implementations produce different behavior:
- BalancedBrain, AggressiveBrain, CautiousBrain, DefensiveBrain (survivors)
- ZombieBrain (enemies -- seek nearest survivor)

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
- `ammo` -- optional in v0.1

### CombatSystem

- Resolves hit attempts (attacker vs target based on range and weapon stats)
- Manages weapon cooldowns (decrement each tick)
- Processes death (health <= 0 marks entity as dead)

---

## Items

### Item (extends Entity)

- `type` -- HealthPack | Ammo (v0.1 minimal)
- `effect` -- what happens on pickup (heal amount, ammo count)

Can also be implemented as a simple struct/data object if full Entity overhead is unnecessary.

### PickupSystem

- Handles item pickup when a survivor steps onto an item tile.
- Applies the item's effect to the survivor.
- Removes the item from the world.

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
