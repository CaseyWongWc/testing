# Core Game Loop

The main simulation loop that drives all game systems each tick.

---

## Tick Rate

- **60 ticks per second** (recommended, configurable between 20-60).
- Each tick represents one complete update cycle for all game systems.

---

## Per-Tick Flow

Each tick executes the following phases in order:

### 1. Sense

Each agent (survivor and enemy) gathers local information:
- Nearby enemies within vision range
- Nearby loot and items
- Objective compass direction
- Exits, terrain, and obstacles

### 2. Decide

Each agent's Brain produces an Intent:
- `Brain.decide(actor, world) -> Intent`
- Intent types: Move, Attack, Loot, Flee, Idle
- AI personality and current state influence the decision

### 3. Act

Intents are resolved:
- Movement is applied (pathfinding, collision)
- Attacks are processed by CombatSystem (hits, cooldowns, damage)
- Item pickups are handled by PickupSystem
- Interaction progress is updated (switch activation, etc.)

### 4. Spawn

Spawners check their cooldowns and resource pools:
- If cooldown is zero and alive count is under max, spawn a new enemy
- Reset cooldown timer after spawning

### 5. Cleanup

Post-tick maintenance:
- Remove dead entities from the world
- Drop loot from killed enemies
- Clear completed objectives
- Update fog-of-war arrays

---

## Game States

The game transitions through the following states:

- **RUNNING** -- Normal gameplay. The tick loop runs all phases each tick.
- **CUTSCENE** -- Win or loss cutscene is playing. Tick loop is paused or running in a limited mode. No gameplay input processed.
- **END** -- Game is over. Results screen displayed. No more ticks.

---

## Definition of "Done" for v0.1

A v0.1 build is considered complete when:

- You can start a run.
- Watch it play (AI survivors move, fight, complete objectives).
- The run ends in a win or lose condition without manual intervention.
