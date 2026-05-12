# CS 4800 — In-Class Exercise 4: Software Architecture Diagram

## Project: WSS2 "A Forgotten Place" — Zero-Player Survival Horror Simulation

---

## Architecture Overview

WSS2 uses a **Layered Architecture** with a clear separation between the Presentation Layer (what the Observer sees), the Application Layer (game systems and logic), and the Data/Infrastructure Layer (state management and rendering). The system runs entirely in the browser as a client-side React + TypeScript application with an optional Express backend for WebSocket features.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                  │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  Observer UI │  │  Camera      │  │  HUD        │  │  Menus &         │  │
│  │  Controls    │  │  System      │  │  Overlay    │  │  Configuration   │  │
│  │             │  │             │  │             │  │                  │  │
│  │ • Speed     │  │ • Observer  │  │ • Health    │  │ • Pre-game       │  │
│  │   Slider    │  │   Grid      │  │   Bars      │  │   Settings       │  │
│  │ • Camera    │  │ • Survivor  │  │ • Objective │  │ • Seed Config    │  │
│  │   Toggle    │  │   Cam       │  │   Status    │  │ • Difficulty     │  │
│  │ • Start/    │  │ • Free Cam  │  │ • Compass   │  │   Selector       │  │
│  │   Stop      │  │ • Free Zoom │  │ • Score     │  │ • Map Size       │  │
│  │ • Pause     │  │             │  │ • Minimap   │  │ • Results Screen │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Canvas Rendering Engine                           │   │
│  │  • HTML5 Canvas 2D context                                          │   │
│  │  • Viewport culling (only render visible tiles)                     │   │
│  │  • SpriteComposer: 5-layer paper-doll system for humanoid entities  │   │
│  │  • Fog-of-war overlay rendering                                     │   │
│  │  • Terrain tile rendering with biome-specific tilesets              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Game Loop Controller                            │   │
│  │  • 60 ticks/sec fixed timestep                                      │   │
│  │  • Per-tick flow: Sense → Decide → Act → Spawn → Cleanup           │   │
│  │  • Game state machine: RUNNING → CUTSCENE → END                     │   │
│  │  • World speed slider integration                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│            ┌───────────────────────┼───────────────────────┐                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │   AI System      │  │   Combat System      │  │  World Systems     │     │
│  │                  │  │                      │  │                    │     │
│  │ • Brain          │  │ • Weapon Manager     │  │ • Map Generator    │     │
│  │   Interface      │  │   (Fists/Melee/Guns) │  │ • Spawner System   │     │
│  │ • BalancedBrain  │  │ • Armor System       │  │ • Objective        │     │
│  │ • AggressiveBrain│  │   (L/M/H + durabil.) │  │   System           │     │
│  │ • CautiousBrain  │  │ • Cover System       │  │ • Fog-of-War       │     │
│  │ • SurvivalistBrn │  │   (Half/Full cover)  │  │   System           │     │
│  │ • MoneyDrivenBrn │  │ • Noise System       │  │ • Day/Night Cycle  │     │
│  │ • ZombieBrain    │  │   (Alert radius)     │  │ • Weather System   │     │
│  │ • BanditBrain    │  │ • Reload Mechanics   │  │ • Faction Manager  │     │
│  │ • RaiderBrain    │  │ • Friendly Fire      │  │ • Rift Portal      │     │
│  │ • MilitaryBrain  │  │ • Damage Calculator  │  │   Controller       │     │
│  │                  │  │                      │  │ • Loot Distribution│     │
│  │ Intent System:   │  │ Distance checks:     │  │ • Pickup System    │     │
│  │ Move|Attack|Loot │  │ Float Euclidean      │  │ • Placeable System │     │
│  │ Flee|Idle|Heal   │  │ (sub-tile accurate)  │  │                    │     │
│  └─────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│            │                       │                       │                │
│            └───────────────────────┼───────────────────────┘                │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Navigation & Pathfinding                          │   │
│  │  • A* pathfinding on integer grid                                   │   │
│  │  • Smooth float-position movement (hybrid model)                    │   │
│  │  • Collision detection using entity radii                           │   │
│  │  • Movement cost per terrain type                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Progression & Economy                             │   │
│  │  • Multi-map run structure (Map → Portal → Market → Next Map)       │   │
│  │  • Survivor Market (buy/sell/heal between maps)                     │   │
│  │  • Gold currency system                                             │   │
│  │  • S/A/B/C/D/F grading system                                      │   │
│  │  • Roguelike difficulty escalation                                  │   │
│  │  • Charms & Lucky Items (difficulty modifiers)                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA / INFRASTRUCTURE LAYER                         │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐     │
│  │   World State         │  │   Map Data                              │     │
│  │                      │  │                                          │     │
│  │ • Entity Registry    │  │ • GridMap (2D Tile array)                │     │
│  │   (Survivors,        │  │ • Tile properties (terrain, walkable,   │     │
│  │    Zombies, Items,   │  │   movementCost, coverValue)             │     │
│  │    Spawners, NPCs)   │  │ • Stamp Library (12-20 building         │     │
│  │ • Faction Table      │  │   templates with rotation/variants)     │     │
│  │ • Objective Queue    │  │ • Biome definitions (6 biomes)          │     │
│  │ • Score Tracker      │  │ • Elevation data (float per tile)       │     │
│  │ • Run Progress       │  │                                          │     │
│  └──────────────────────┘  └──────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐     │
│  │   Entity Data Model   │  │   Procedural Generation Engine          │     │
│  │                      │  │                                          │     │
│  │ Entity (base)        │  │ • Seeded PRNG (deterministic)            │     │
│  │  ├─ Actor            │  │ • Terrain generator                      │     │
│  │  │   ├─ Survivor     │  │ • Building stamp placer                  │     │
│  │  │   ├─ Zombie       │  │ • Interior dressing pass                 │     │
│  │  │   └─ EnemyHuman   │  │ • Loot distribution (themed by          │     │
│  │  ├─ CorruptionNest   │  │   building type)                        │     │
│  │  ├─ RiftPortal       │  │ • Entity placement (survivors,          │     │
│  │  ├─ Placeable        │  │   enemies, nests, portal)               │     │
│  │  └─ Item             │  │                                          │     │
│  └──────────────────────┘  └──────────────────────────────────────────┘     │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                   Technology Stack                                   │   │
│  │  • React 18 + TypeScript (UI framework)                             │   │
│  │  • Vite (build tool + dev server)                                   │   │
│  │  • HTML5 Canvas API (2D rendering)                                  │   │
│  │  • Tailwind CSS (UI styling)                                        │   │
│  │  • Express 5 (backend server, optional)                             │   │
│  │  • WebSocket (real-time features, optional)                         │   │
│  │  • All state in-memory (no database)                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

                        EXTERNAL ACTORS / INTERFACES

┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐
│   Observer     │  │   AI Survivor │  │   Enemy AI    │  │   Game System  │
│   (Human)      │  │   (Autonomous)│  │   (Autonomous)│  │   (Engine)     │
│                │  │               │  │               │  │                │
│ • Starts run   │  │ • Navigate    │  │ • Zombies     │  │ • Tick loop    │
│ • Configures   │  │ • Fight/Flee  │  │ • Bandits     │  │ • Spawning     │
│ • Watches      │  │ • Scavenge    │  │ • Raiders     │  │ • Scoring      │
│ • Switches cam │  │ • Objectives  │  │ • Military    │  │ • Win/Lose     │
│ • Adjusts speed│  │ • Trade/Heal  │  │ • Pursuit     │  │ • Map Gen      │
│ NO direct      │  │ • Revive      │  │ • Noise react │  │ • Progression  │
│ control of AI  │  │ 5 personality │  │ 3 factions    │  │ • Grading      │
└───────────────┘  └───────────────┘  └───────────────┘  └────────────────┘
```

---

## Layer Descriptions

### Presentation Layer
The topmost layer handles everything the Observer sees and interacts with. It contains the camera system (4 modes), the HUD overlay, pre-game configuration menus, and the Canvas Rendering Engine which draws the game world using a 5-layer sprite compositing system for entities and tile-based terrain rendering with fog-of-war overlays.

### Application Layer
The core game logic layer, organized around the Game Loop Controller running at 60 ticks/sec. It contains three major subsystems:
- **AI System**: Brain interface with 9+ implementations (5 survivor personalities + zombie + 3 enemy humanoid types). Produces Intents (Move, Attack, Loot, Flee, Idle) each tick.
- **Combat System**: Handles weapon mechanics (3 classes), armor durability, cover calculations, noise propagation, reload mechanics, and friendly fire.
- **World Systems**: Map generation, spawner management, objective tracking, fog-of-war updates, day/night cycle, weather, faction relationships, loot distribution, and portal control.

Shared subsystems include Navigation/Pathfinding (A* on grid, smooth float movement) and Progression/Economy (multi-map runs, market, grading, currency).

### Data / Infrastructure Layer
The bottom layer manages all game state and data structures. The World State holds entity registries, faction tables, objective queues, and score tracking. The Map Data stores the GridMap (2D tile array), building stamp library, and biome definitions. The Entity Data Model defines the OOP class hierarchy (Entity → Actor → Survivor/Zombie/EnemyHuman). The Procedural Generation Engine uses seeded PRNG for deterministic map creation.

### External Actors
Four actor types interact with the system:
- **Observer (Human)**: Meta-controls only — no direct AI control
- **AI Survivor**: Fully autonomous agents with 5 personality types
- **Enemy AI**: Zombies and hostile humans with faction-based targeting
- **Game System**: The engine itself manages ticks, spawning, scoring, and progression

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Client-side architecture (no server required for core game) | Zero-player simulation runs entirely in browser; reduces deployment complexity |
| Fixed 60 TPS game loop with Sense→Decide→Act→Spawn→Cleanup | Deterministic, reproducible simulation; clear phase separation prevents order-dependent bugs |
| Brain interface pattern for AI | Swappable personality types via polymorphism; same interface for survivors, zombies, and enemy humans |
| Hybrid movement model (grid pathfinding + float positions) | Grid simplifies AI logic; floats enable smooth rendering and sub-tile entity sizing |
| Seeded PRNG for all procedural generation | Enables deterministic replay and regression testing (Golden Seed Test) |
| In-memory state only (no database) | Appropriate for academic project; game state is transient per run |
| Layered architecture with defined interfaces | Each system (combat, AI, map gen) is independently testable and modifiable |

---

## Data Flow

```
Observer configures run settings
         │
         ▼
Procedural Generation Engine creates map (seed-based, deterministic)
         │
         ▼
Game Loop starts (60 ticks/sec)
         │
    ┌────┴────┐
    ▼         ▼
 Survivors  Enemies    ← Each runs Brain.decide(actor, world) → Intent
    │         │
    └────┬────┘
         ▼
   Combat System resolves attacks, Noise System propagates alerts
         │
         ▼
   Spawner System checks cooldowns, spawns new enemies
         │
         ▼
   Objective System checks completion, updates portal state
         │
         ▼
   Cleanup: remove dead entities, drop loot, update fog
         │
         ▼
   Rendering Engine draws current state to Canvas
         │
         ▼
   (repeat until WIN or LOSE)
         │
         ▼
   Grading System calculates S/A/B/C/D/F score
         │
         ▼
   If multi-map: Survivor Market → next map (harder)
```
