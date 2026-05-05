# WSS2 "A Forgotten Place" — Software Architecture Layout Diagram Spec
# For Lucidchart / Diagram Tool Generation

---

## PRIMARY ACTORS (Top of diagram)

Place these at the top as stick figures or actor icons:

1. **Observer (Human)** — Configures run, watches simulation, switches cameras
2. **AI Survivors (Autonomous)** — 5 personality types, fully autonomous agents
3. **Enemy AI (Autonomous)** — Zombies + hostile humans, faction-based behavior
4. **Game Engine** — Tick loop, spawning, scoring, win/lose detection

---

## LAYER 1: PRESENTATION LAYER (Top layer box)

Label: "Presentation Layer"

### Components (boxes inside this layer):

| Component | Details |
|---|---|
| **Observer UI Controls** | Speed Slider, Camera Toggle, Start/Stop, Pause |
| **Camera System** | Observer Grid, Survivor Cam, Free Cam, Free Zoom (4 modes) |
| **HUD Overlay** | Health Bars, Objective Status, Compass, Score, Minimap |
| **Menus & Configuration** | Pre-game Settings, Seed Config, Difficulty Selector, Map Size, Results Screen |
| **Canvas Rendering Engine** | HTML5 Canvas 2D, Viewport Culling, 5-Layer SpriteComposer (Body → Head → Armor → Arms/Weapon → Status), Fog-of-War Overlay, Terrain Tile Rendering |

### Connections from Presentation Layer:
- Observer UI Controls → Game Loop Controller (start/stop/speed commands)
- Canvas Rendering Engine ← World State (reads current state each frame)
- HUD Overlay ← Objective System + Score Tracker (reads status)
- Camera System → Canvas Rendering Engine (determines viewport)

---

## LAYER 2: APPLICATION LAYER (Middle layer box)

Label: "Application Layer"

### Core Controller:

| Component | Details |
|---|---|
| **Game Loop Controller** | 60 ticks/sec fixed timestep. Per-tick: Sense → Decide → Act → Spawn → Cleanup. Game states: RUNNING → CUTSCENE → END |

### Three Major Subsystems (3 boxes side by side):

#### Box 1: AI System
| Sub-component | Details |
|---|---|
| Brain Interface | `decide(actor, world) → Intent` |
| Survivor Brains (5) | Balanced, Aggressive, Cautious, Survivalist, Money-Driven |
| Enemy Brains (4+) | ZombieBrain, BanditBrain, RaiderBrain, MilitaryBrain |
| Intent System | Move, Attack, Loot, Flee, Idle, Heal |
| Radio System | Team awareness, shared threat info |

#### Box 2: Combat System
| Sub-component | Details |
|---|---|
| Weapon Manager | 3 classes: Fists, Melee, Guns |
| Armor System | Light/Medium/Heavy + durability degradation |
| Cover System | Half cover (25%) / Full cover (50%), directional |
| Noise System | Weapon noise radius, alerts enemies in range |
| Reload Mechanics | Reload time per weapon, interruptible |
| Damage Calculator | Attacker stats vs defender stats + cover + armor |
| Friendly Fire | ON — full damage to allies |

#### Box 3: World Systems
| Sub-component | Details |
|---|---|
| Map Generator | Procedural terrain + building stamps + dressing |
| Spawner System | Corruption Nests spawn enemies on cooldown |
| Objective System | 6 types: ActivateSwitch, Survive, Extract, DestroyNests, Collect, Rescue |
| Fog-of-War System | Shared team vision, vision radius per entity |
| Day/Night Cycle | Time-of-day affects vision, enemy behavior |
| Faction Manager | PLAYER_TEAM / HOSTILE / NEUTRAL relationships |
| Rift Portal Controller | SEALED → OPEN → ACTIVATED (objectives unseal) |
| Loot Distribution | Themed by building type, clustered indoors, sparser outdoors |
| Pickup System | Item collection on proximity |
| Placeable System | Survivor-built barricades, turrets, traps |

### Shared Subsystems (spanning width):

| Component | Details |
|---|---|
| **Navigation & Pathfinding** | A* on integer grid, smooth float-position movement, collision detection (entity radii 0.3-0.4 tiles), movement cost per terrain |
| **Progression & Economy** | Multi-map runs (Map → Portal → Market → Next Map), Survivor Market (buy/sell/heal), Gold currency, S/A/B/C/D/F grading, Roguelike difficulty escalation, Charms & Lucky Items |

### Connections within Application Layer:
- Game Loop Controller → AI System (triggers Sense + Decide phases)
- Game Loop Controller → Combat System (triggers Act phase)
- Game Loop Controller → World Systems (triggers Spawn + Cleanup phases)
- AI System → Navigation & Pathfinding (movement intents use A*)
- AI System → Combat System (attack intents resolved here)
- Combat System → World Systems / Noise System (weapon fire triggers noise alerts)
- Objective System → Rift Portal Controller (completion count unseals portal)
- Spawner System ← Corruption Nests in Data Layer

---

## LAYER 3: DATA / INFRASTRUCTURE LAYER (Bottom layer box)

Label: "Data / Infrastructure Layer"

### Components:

| Component | Details |
|---|---|
| **World State** | Entity Registry (survivors, zombies, items, spawners, NPCs), Faction Table, Objective Queue, Score Tracker, Run Progress |
| **GridMap** | 2D Tile array — each tile has: terrainType, walkable, movementCost, coverValue, coverDirection, elevation (float) |
| **Stamp Library** | 12-20 building templates with rotation/mirror variants, biome-weighted selection |
| **Biome Definitions** | 6 biomes with terrain palettes, enemy rosters, loot tables |
| **Seeded PRNG** | Deterministic random number generator — same seed = same map (Golden Seed Test: 12345, 30x30, 300 ticks) |

### Entity Class Hierarchy (show as tree or UML-style):
```
Entity (base: id, position, alive)
 ├── Actor (health, stamina, strength, defense, speed, accuracy, morale, faction)
 │    ├── Survivor (inventory, weapon, armor, brain)
 │    ├── Zombie (simplified brain, no inventory)
 │    └── EnemyHumanoid (inventory, weapon, armor, brain — Bandit/Raider/Military/Scavenger)
 ├── CorruptionNest (spawnRate, maxCapacity, tier, corruptionEnergy)
 ├── RiftPortal (state: SEALED/OPEN/ACTIVATED, objectivesRequired)
 ├── Placeable (durability, cost, effect, faction)
 └── Item (type, effect — HealthPack/Ammo/Armor/Weapon/Consumable)
```

### Connections from Data Layer:
- World State ↔ Application Layer (read/write each tick)
- GridMap → Pathfinder (walkability + movement costs)
- GridMap → Cover System (cover values per tile)
- Stamp Library → Map Generator (building placement)
- Seeded PRNG → Map Generator + Loot Distribution + Entity Placement

---

## TECHNOLOGY STACK (Bottom bar or side annotation)

| Technology | Role |
|---|---|
| React 18 + TypeScript | UI framework + type safety |
| Vite | Build tool + dev server |
| HTML5 Canvas API | 2D game rendering |
| Tailwind CSS | UI component styling |
| Express 5 | Backend server (optional, for WebSocket) |
| WebSocket (ws) | Real-time features (optional) |
| In-memory state | No database — transient per run |

---

## DATA FLOW (Show as arrows through the layers)

```
Observer → [Presentation] Configure run settings
                ↓
[Data] Seeded PRNG → Map Generator creates map
                ↓
[Application] Game Loop starts (60 ticks/sec)
                ↓
        Sense → Decide → Act → Spawn → Cleanup
                ↓
[Presentation] Canvas renders current frame
                ↓
        (repeat until WIN or LOSE)
                ↓
[Application] Grading System → S/A/B/C/D/F
                ↓
        If multi-map: Market → next map (harder)
```

---

## LAYOUT NOTES FOR LUCIDCHART

- **Top**: Primary Actors row (4 stick figures)
- **Layer 1** (top box): Presentation Layer — Observer UI, Camera, HUD, Menus, Canvas Engine
- **Layer 2** (middle box, largest): Application Layer — Game Loop at top, 3 subsystem boxes side-by-side (AI | Combat | World), shared Navigation + Progression bar below
- **Layer 3** (bottom box): Data Layer — World State, GridMap, Stamps, Biomes, PRNG, Entity hierarchy
- **Bottom bar**: Technology Stack
- **Arrows**: Show data flow direction between layers and components
- **Color coding suggestion**: Blue = Presentation, Green = Application, Orange = Data, Gray = Tech Stack
