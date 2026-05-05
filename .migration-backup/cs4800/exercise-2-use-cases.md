# In-Class Exercise 2: High-Level Use Cases
## "A Forgotten Place" (WSS2) — Zero-Player Survival Horror Game
### CS 4800 Software Engineering | Casey Wong

---

## 1. Actors

### Primary Actors

| Actor | Description |
|-------|-------------|
| **Observer (Player)** | The human user who launches runs, configures settings, controls the camera, and watches the simulation unfold. Does not directly control survivors — only observes and adjusts the viewing experience. |
| **AI Survivor** | An autonomous agent controlled by the game's brain system. Navigates the map, fights enemies, scavenges loot, completes objectives, and attempts evacuation through the Rift Portal. Each survivor has a personality type (Balanced, Aggressive, Cautious, Survivalist, Money-Driven). |

### Secondary Actors

| Actor | Description |
|-------|-------------|
| **Zombie** | AI-controlled enemy that spawns from Corruption Nests and attacks survivors on sight. Varies in type (standard, fast, tank, etc.). |
| **Hostile Human** | AI-controlled enemy faction. Carries weapons, armor, and loot that can be dropped on death. More dangerous than zombies but also more rewarding. |
| **Corruption Nest** | Environmental spawner entity. Periodically generates zombie enemies. Can be destroyed by survivors as an objective. |
| **Rift Portal** | The map exit goal. Sealed at the start of each map; unsealed when all required objectives are completed. Survivors must reach it to evacuate. |
| **Survivor Market** | Between-map trading system. Appears after successful evacuation. Survivors can buy/sell equipment, weapons, and supplies using currency earned during the run. |
| **Game System (Engine)** | The underlying game loop, procedural map generator, difficulty scaler, scoring/grading system, and fog-of-war manager. Orchestrates all simulation rules. |

---

## 2. Use Cases by Actor

### Observer (Player) Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-01 | **Start New Run** | The observer initiates a new game run, which triggers procedural map generation and survivor placement. |
| UC-02 | **Configure Pre-Game Settings** | Adjust difficulty, loot distribution slider, number of survivors, biome preferences, and optional toggles (friendly fire, loot respawn) before starting a run. |
| UC-03 | **Switch Camera Mode** | Toggle between Observer Grid (all survivors), Survivor Cam (follow one), Free Cam (pan freely), and Free Zoom during gameplay. |
| UC-04 | **Adjust Game Speed** | Speed up, slow down, or pause the simulation using the world speed slider. |
| UC-05 | **View HUD & Objectives** | Monitor survivor health/status, current objectives, objective progress, and compass indicators on the HUD. |
| UC-06 | **View Run Results** | After a run ends (evacuation or team wipe), view the grading screen (S/A/B/C/D/F), survivor stats, loot collected, objectives completed, and time survived. |

### AI Survivor Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-07 | **Navigate Map** | Use A* pathfinding on the grid to move smoothly toward objectives, loot, or safety. Compass navigation guides movement when no immediate goal is visible. |
| UC-08 | **Engage in Combat** | Attack enemies using equipped weapons (fists, melee, or guns). Includes target selection, weapon switching, and ammo management. |
| UC-09 | **Scavenge Loot** | Search buildings, containers, and ground items for weapons, ammo, armor, food, water, and currency. |
| UC-10 | **Activate Objective** | Move to an objective location (switch, extraction point, collection target) and interact with it to progress toward unsealing the Rift Portal. |
| UC-11 | **Help / Revive Teammate** | Respond to nearby allies in danger. Availability-based — any survivor who can help will attempt to help, regardless of personality. |
| UC-12 | **Flee from Danger** | Retreat from combat when health is low, ammo is depleted, or morale drops. Move toward allies or away from threats. |
| UC-13 | **Manage Equipment** | Reload weapons, swap weapons, use healing items, equip armor, and manage inventory (1 backpack limit per survivor). |
| UC-14 | **Evacuate through Rift Portal** | Once all objectives are complete and the Rift Portal is unsealed, navigate to it and evacuate to end the map. |
| UC-15 | **Trade at Survivor Market** | Between maps, buy/sell weapons, ammo, and supplies using earned currency. AI makes purchase decisions based on personality and current needs. |

### Zombie Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-16 | **Spawn from Corruption Nest** | Zombies are generated periodically by Corruption Nests based on difficulty level and wave timing. |
| UC-17 | **Pursue and Attack Survivors** | Detect survivors within vision/hearing range and move to attack them using melee combat. |

### Hostile Human Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-18 | **Patrol Territory** | Move through assigned areas, guarding locations or wandering between points of interest. |
| UC-19 | **Engage Survivors** | Attack survivors using ranged and melee weapons with tactical behavior (cover-seeking, flanking). |
| UC-20 | **Drop Loot on Death** | When killed, drop carried weapons, ammo, armor, consumables, and currency for survivors to scavenge. |

### Game System Use Cases

| ID | Use Case | Description |
|----|----------|-------------|
| UC-21 | **Generate Procedural Map** | Create terrain, place buildings from the stamp library, populate loot containers, position spawners and objectives. |
| UC-22 | **Manage Fog of War** | Track shared team vision, reveal/hide map areas based on survivor positions and vision ranges. |
| UC-23 | **Scale Difficulty** | Apply adaptive difficulty between maps (roguelike escalation). Adjust enemy count, loot quality, and spawner intensity. |
| UC-24 | **Calculate Run Grade** | Score the run based on objectives completed, survivors evacuated, time taken, and loot collected. Assign S/A/B/C/D/F grade. |

---

## 3. Use Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        "A Forgotten Place" (WSS2)                               │
│                     Zero-Player Survival Horror Game                            │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐     │
│  │                         SYSTEM BOUNDARY                                │     │
│  │                                                                        │     │
│  │    ┌──────────────────┐    ┌──────────────────┐                        │     │
│  │    │  Start New Run   │    │ Configure Settings│                        │     │
│  │    │     (UC-01)      │    │     (UC-02)       │                        │     │
│  │    └────────┬─────────┘    └────────┬──────────┘                        │     │
│  │             │                       │                                   │     │
│  │    ┌────────┴─────────┐    ┌────────┴──────────┐                        │     │
│  │    │  Switch Camera   │    │  Adjust Game Speed│                        │     │
│  │    │     (UC-03)      │    │     (UC-04)       │                        │     │
│  │    └──────────────────┘    └───────────────────┘                        │     │
│  │                                                                        │     │
│  │    ┌──────────────────┐    ┌──────────────────┐                        │     │
│  │    │   View HUD &     │    │  View Run Results│                        │     │
│  │    │  Objectives      │    │     (UC-06)       │                        │     │
│  │    │   (UC-05)        │    └──────────────────┘                        │     │
│  │    └──────────────────┘                                                │     │
│  │                                                                        │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                     AI SIMULATION LAYER                                │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │    │ Navigate Map │  │   Combat     │  │ Scavenge Loot│                │     │
│  │    │   (UC-07)    │  │   (UC-08)    │  │   (UC-09)    │                │     │
│  │    └──────────────┘  └──────────────┘  └──────────────┘                │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │    │  Activate    │  │ Help/Revive  │  │    Flee      │                │     │
│  │    │  Objective   │  │  Teammate    │  │   (UC-12)    │                │     │
│  │    │   (UC-10)    │  │   (UC-11)    │  └──────────────┘                │     │
│  │    └──────────────┘  └──────────────┘                                  │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │    │   Manage     │  │  Evacuate    │  │   Trade at   │                │     │
│  │    │  Equipment   │  │  via Portal  │  │   Market     │                │     │
│  │    │   (UC-13)    │  │   (UC-14)    │  │   (UC-15)    │                │     │
│  │    └──────────────┘  └──────────────┘  └──────────────┘                │     │
│  │                                                                        │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                    ENEMY / ENVIRONMENT LAYER                           │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │    │ Spawn from   │  │ Pursue &     │  │   Patrol     │                │     │
│  │    │    Nest      │  │   Attack     │  │  Territory   │                │     │
│  │    │   (UC-16)    │  │   (UC-17)    │  │   (UC-18)    │                │     │
│  │    └──────────────┘  └──────────────┘  └──────────────┘                │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐                                  │     │
│  │    │   Engage     │  │  Drop Loot   │                                  │     │
│  │    │  Survivors   │  │  on Death    │                                  │     │
│  │    │   (UC-19)    │  │   (UC-20)    │                                  │     │
│  │    └──────────────┘  └──────────────┘                                  │     │
│  │                                                                        │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                       GAME ENGINE LAYER                                │     │
│  │    ═══════════════════════════════════════════════                      │     │
│  │                                                                        │     │
│  │    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │     │
│  │    │  Generate    │  │  Manage Fog  │  │   Scale      │                │     │
│  │    │  Proc. Map   │  │  of War      │  │  Difficulty  │                │     │
│  │    │   (UC-21)    │  │   (UC-22)    │  │   (UC-23)    │                │     │
│  │    └──────────────┘  └──────────────┘  └──────────────┘                │     │
│  │                                                                        │     │
│  │    ┌──────────────┐                                                    │     │
│  │    │  Calculate   │                                                    │     │
│  │    │  Run Grade   │                                                    │     │
│  │    │   (UC-24)    │                                                    │     │
│  │    └──────────────┘                                                    │     │
│  │                                                                        │     │
│  └────────────────────────────────────────────────────────────────────────┘     │
│                                                                                 │
│  ACTORS:                                                                        │
│                                                                                 │
│  [PRIMARY]                          [SECONDARY]                                 │
│  ┌─────────────┐                    ┌─────────────┐  ┌─────────────┐           │
│  │  Observer    │──→ UC-01..UC-06   │   Zombie     │──→ UC-16..UC-17│           │
│  │  (Player)   │                    └─────────────┘  └─────────────┘           │
│  └─────────────┘                    ┌─────────────┐  ┌─────────────┐           │
│  ┌─────────────┐                    │  Hostile     │──→ UC-18..UC-20│           │
│  │ AI Survivor │──→ UC-07..UC-15    │   Human      │  └─────────────┘           │
│  └─────────────┘                    └─────────────┘                             │
│                                     ┌─────────────┐  ┌─────────────┐           │
│                                     │ Corruption  │──→ UC-16        │           │
│                                     │   Nest      │  └─────────────┘           │
│                                     └─────────────┘                             │
│                                     ┌─────────────┐  ┌─────────────┐           │
│                                     │ Rift Portal │──→ UC-14        │           │
│                                     └─────────────┘  └─────────────┘           │
│                                     ┌─────────────┐  ┌─────────────┐           │
│                                     │  Survivor   │──→ UC-15        │           │
│                                     │   Market    │  └─────────────┘           │
│                                     └─────────────┘                             │
│                                     ┌─────────────┐  ┌─────────────┐           │
│                                     │ Game System │──→ UC-21..UC-24│           │
│                                     │  (Engine)   │  └─────────────┘           │
│                                     └─────────────┘                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Actor-to-Use-Case Relationship Summary

```
Observer (Player)  ──────────►  UC-01: Start New Run
                   ──────────►  UC-02: Configure Pre-Game Settings
                   ──────────►  UC-03: Switch Camera Mode
                   ──────────►  UC-04: Adjust Game Speed
                   ──────────►  UC-05: View HUD & Objectives
                   ──────────►  UC-06: View Run Results

AI Survivor        ──────────►  UC-07: Navigate Map
                   ──────────►  UC-08: Engage in Combat
                   ──────────►  UC-09: Scavenge Loot
                   ──────────►  UC-10: Activate Objective
                   ──────────►  UC-11: Help / Revive Teammate
                   ──────────►  UC-12: Flee from Danger
                   ──────────►  UC-13: Manage Equipment
                   ──────────►  UC-14: Evacuate through Rift Portal
                   ──────────►  UC-15: Trade at Survivor Market

Zombie             ──────────►  UC-16: Spawn from Corruption Nest
                   ──────────►  UC-17: Pursue and Attack Survivors

Hostile Human      ──────────►  UC-18: Patrol Territory
                   ──────────►  UC-19: Engage Survivors
                   ──────────►  UC-20: Drop Loot on Death

Game System        ──────────►  UC-21: Generate Procedural Map
                   ──────────►  UC-22: Manage Fog of War
                   ──────────►  UC-23: Scale Difficulty
                   ──────────►  UC-24: Calculate Run Grade
```

### Key Use Case Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| UC-01 → UC-21 | **<<includes>>** | Starting a new run always triggers procedural map generation |
| UC-01 → UC-22 | **<<includes>>** | Starting a run initializes the fog of war system |
| UC-08 → UC-13 | **<<includes>>** | Combat includes equipment management (reload, swap weapons) |
| UC-08 → UC-20 | **<<includes>>** | Killing hostile humans triggers loot drops |
| UC-10 → UC-14 | **<<extends>>** | Completing all objectives enables the Evacuate use case |
| UC-14 → UC-15 | **<<extends>>** | Successful evacuation triggers the Survivor Market |
| UC-14 → UC-24 | **<<includes>>** | Evacuation (or team wipe) triggers run grade calculation |
| UC-16 → UC-17 | **<<includes>>** | Spawned zombies immediately begin pursuing survivors |

---

## 4. Notes on Zero-Player Design

"A Forgotten Place" is a **zero-player game** — the Observer (Player) does not directly control any characters. This creates a unique actor relationship:

- The **Observer** only interacts with **meta-game systems** (settings, camera, speed, results).
- The **AI Survivor** is the true protagonist actor, making all tactical and strategic decisions autonomously through the brain system.
- The relationship between Observer and AI Survivor is **observation-only** — the Observer watches the AI make decisions but cannot override them.
- This design pattern is similar to games like Dwarf Fortress (Fortress mode), RimWorld (with AI storyteller), or idle/incremental games — but applied to a survival horror context.

---

*Source Document: WSS2 "A Forgotten Place" Design Documents (Notion)*
*Created for CS 4800 Software Engineering — Spring 2026*
