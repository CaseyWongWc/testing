# CS 4800 — In-Class Exercise 3: Requirements

## Project: WSS2 "A Forgotten Place" — Zero-Player Survival Horror Simulation

---

> **📌 Reading note (added for final submission, May 2026)**
>
> This document is the **target requirements specification** drafted during requirements engineering (March 2026). It captures the *full* designed scope of the simulation — including features that were intentionally deferred from the academic submission for time-boxing reasons.
>
> For the **actually-delivered scope as of this submission**, see:
> - `01-project-charter/01-project-charter.md` §4 — In Scope vs Out of Scope
> - `07-release-notes/07-release-notes.md` — features grouped by shipped release
>
> Notable requirements in this document that are **deferred** (not in v0.5.x): full 6-biome map generator (only forest/city shipped), hostile-human factions (the brain code exists but no hostile-human spawns are wired into the live maps), multi-map progression with Survivor-Market-between-runs (replaced by single-run + meta shop in Phase 3), and any Phase 8+ LLM systems. These remain on the roadmap.
>
> All requirements that *are* implemented in v0.5.x have at least one corresponding test case in `04-test-case-spec/04-test-case-spec.md`.

---

## 1. Functional Requirements

### Core Simulation
- **FR-01**: The system shall procedurally generate grid-based maps (30x30, 40x40, or 60x60 tiles) with terrain, buildings, and entity placement based on a configurable seed.
- **FR-02**: The system shall spawn 1–5 AI-controlled survivors at the center of the map at the start of each run.
- **FR-03**: AI survivors shall autonomously navigate the map using A* pathfinding on the integer grid with smooth float-position movement.
- **FR-04**: The system shall simulate a real-time game loop at 60 ticks per second, processing entity actions each tick in the order: Sense → Decide → Act → Spawn → Cleanup.
- **FR-05**: The system shall support a world speed slider allowing the Observer to adjust simulation speed during gameplay.

### Combat System
- **FR-06**: The system shall implement real-time combat with three weapon classes: fists (infinite, melee fallback), melee weapons (durability-based), and guns (ammo-based, noise-generating).
- **FR-07**: Guns shall generate noise within a configurable radius that attracts nearby enemies.
- **FR-08**: The system shall implement an armor system (Light, Medium, Heavy) with durability that depletes on damage absorption.
- **FR-09**: The system shall implement a cover system where half cover reduces incoming ranged damage by 25% and full cover reduces it by 50%.
- **FR-10**: Friendly fire shall be enabled — all projectiles and melee attacks deal full damage to allied entities.
- **FR-11**: Melee weapons shall break and become unusable when their durability reaches zero.
- **FR-12**: Guns shall require reload time during which the survivor can move but cannot fire; reloading is interrupted by taking damage or switching weapons.

### AI Decision-Making
- **FR-13**: Each AI survivor shall operate using one of five personality types: Balanced, Aggressive, Cautious, Survivalist, or Money-Driven, each with distinct decision-making weights.
- **FR-14**: AI brains shall use a hybrid tick-based (default every tick, fallback every 5) and event-driven architecture, responding to interrupts such as taking damage or running low on ammo.
- **FR-15**: AI survivors shall autonomously decide between fighting, fleeing, scavenging, healing, activating objectives, and helping teammates based on personality and current state.
- **FR-16**: Revive behavior shall be availability-based — any survivor who is able and nearby will attempt to revive a downed teammate regardless of personality type.

### Objectives & Win/Lose
- **FR-17**: The system shall support six objective types: ActivateSwitch, Survive, Extract/ReachPortal, DestroyNests, Collect, and Rescue.
- **FR-18**: Objectives shall be location-based, sequential, and revealed one at a time on the HUD with progressive text reveal.
- **FR-19**: A compass shall point each survivor toward the current active objective (disabled in Hardcore mode).
- **FR-20**: The Rift Portal shall start sealed at the center of the map and unseal only after all objectives are completed.
- **FR-21**: The system shall implement soft lock-in portal evacuation — survivors enter one at a time; the map is won when all living survivors have entered.
- **FR-22**: The system shall declare a loss when all AI survivors are dead (permadeath).
- **FR-23**: The system shall assign an S/A/B/C/D/F grade at the end of each map based on objectives completed, survivors evacuated, time taken, and loot collected.

### Map Generation & Environment
- **FR-24**: The map generator shall place buildings using a Stamp Library of 12–20 pre-authored templates with rotation, ruined variants, and prop randomization.
- **FR-25**: Buildings shall contain gameplay hooks: doors, loot sockets, cover clusters, and spawn points.
- **FR-26**: The system shall implement Corruption Nests as physical enemy spawners (Small, Medium, Large) that use a resource pool (Corruption Energy) to produce enemies in waves.
- **FR-27**: The system shall implement shared team fog-of-war with two states: visible (currently seen) and explored (previously seen but not currently visible).
- **FR-28**: The system shall support six biomes: Forested Hills, Dense Forest, Desert, Rocky Mountains, City, and Snow Region.

### Enemies & Factions
- **FR-29**: The system shall implement multiple zombie types: Basic, Runner, Tank, Spitter, Screamer, and Boss variants.
- **FR-30**: The system shall implement hostile human enemies (Bandits, Raiders, Military Remnants) using the same combat and brain system as survivors.
- **FR-31**: The system shall implement a faction system with three factions: PLAYER_TEAM, HOSTILE, and NEUTRAL, governing attack targeting and AI behavior.

### Economy & Progression
- **FR-32**: The system shall implement a gold currency earned from kills and scavenging.
- **FR-33**: A Survivor Market shall appear between maps as a safe zone where survivors can buy/sell items, heal, and restock.
- **FR-34**: The system shall implement multi-map progression: Map 1 → Rift Portal → Survivor Market → Map 2 (harder) → repeat, with roguelike difficulty escalation.

### Observer Interface
- **FR-35**: The system shall provide four camera modes: Observer Grid (split view of all survivors), Survivor Cam (follow one survivor), Free Cam (detached), and Free Zoom.
- **FR-36**: The system shall display a HUD showing round counter, score, objective status, compass, and survivor health/resource indicators.

### Loot System
- **FR-37**: Loot shall be clustered in buildings with themed containers (hospitals yield medical items, military buildings yield weapons/ammo).
- **FR-38**: Enemy drops shall include weapons, ammo, armor, food/water, currency, clothes, and backpacks (max 1 backpack per survivor).
- **FR-39**: Loot shall respawn by default (togglable); container loot is one-time, respawns appear as new ground items or containers.

---

## 2. Non-Functional Requirements

| ID | Requirement | Verification Criteria |
|---|---|---|
| **NFR-01** | **Performance**: The simulation shall maintain 60 ticks per second with up to 5 survivors, 50 enemies, and a 60x60 map without frame drops below 30 FPS. | Run the Golden Seed Test (seed 12345, 30x30, 300 ticks) and measure average TPS and FPS using browser performance profiling tools. TPS must stay above 55; FPS must stay above 30. |
| **NFR-02** | **Responsiveness**: The UI shall respond to Observer inputs (camera switch, speed slider, menu interactions) within 100ms. | Measure input-to-visual-change latency using browser DevTools performance timeline across 10 repeated actions. 95th percentile must be under 100ms. |
| **NFR-03** | **Determinism**: Given the same seed and configuration, the simulation shall produce identical results across runs. | Run the same seed/config 5 times, capture the game state at tick 300, and compare entity positions, health values, and scores. All runs must produce identical state snapshots. |
| **NFR-04** | **Scalability**: The map generator shall produce valid maps for all supported sizes (30x30, 40x40, 60x60) within 2 seconds of initialization. | Generate 10 maps at each size, measure wall-clock time from generation start to first rendered frame. All must complete within 2 seconds. |
| **NFR-05** | **Browser Compatibility**: The application shall run correctly on Chrome 100+, Firefox 100+, and Edge 100+. | Execute the full test suite and play through one complete map on each browser. No JavaScript errors, no rendering glitches, all features functional. |
| **NFR-06** | **Usability**: A new user shall be able to start a simulation run within 60 seconds of loading the application. | Conduct a usability test with 3 users unfamiliar with the app. Measure time from page load to first simulation start. All must be under 60 seconds. |
| **NFR-07** | **Memory Usage**: The application shall not exceed 512MB of browser memory during a standard 30x30 map run with 5 survivors. | Monitor browser memory usage via Chrome Task Manager during a full 30x30 run. Peak memory must stay below 512MB. |
| **NFR-08** | **Reliability**: The simulation shall run for at least 30 minutes continuously without crashing or freezing. | Start a 60x60 map with 5 survivors and let the simulation run for 30 minutes unattended. No unhandled exceptions, no UI freezes longer than 3 seconds. |
| **NFR-09** | **Maintainability**: Each game system (combat, AI, map generation, etc.) shall be encapsulated in a self-contained module with a defined interface. | Code review verifying that each system has a single entry point, documented interface, and no circular dependencies with other systems. |
| **NFR-10** | **Accessibility**: All UI controls (buttons, sliders, camera toggles) shall be keyboard-navigable and have visible focus indicators. | Tab through all interactive elements and verify each is reachable and visually indicated. Screen reader test confirms all controls have accessible labels. |

---

## 3. Domain-Specific Requirements

### Zero-Player Game Design
- **DSR-01**: The system shall operate as a zero-player game — once the Observer starts a run, all survivor actions shall be fully autonomous with no direct player control over individual survivors.
- **DSR-02**: The Observer's role shall be limited to meta-controls: starting/stopping runs, configuring pre-game settings, switching cameras, and adjusting simulation speed.
- **DSR-03**: AI decision-making shall use classical/explainable AI (Sense → Decide → Act) rather than opaque machine learning, so that each decision can be traced and understood.

### Survival Horror Mechanics
- **DSR-04**: The system shall implement resource scarcity — ammo, food, water, and medical supplies shall be limited and require active scavenging to sustain survivors.
- **DSR-05**: Permadeath shall be enforced — once a survivor dies, they are permanently removed from the current run (no respawning).
- **DSR-06**: The noise mechanic shall create risk-reward tension — using guns is effective but attracts more enemies; melee and stealth are safer but less powerful.
- **DSR-07**: The day/night cycle shall affect gameplay: reduced vision at night, increased enemy aggression, and altered AI risk calculations.

### Procedural Generation
- **DSR-08**: Map generation shall be seed-based and deterministic — the same seed shall always produce the same map layout, entity placement, and loot distribution.
- **DSR-09**: Building placement shall follow contextual rules — military structures appear in clusters, hospitals near roads, residential buildings in groups — not randomly scattered.
- **DSR-10**: Loot distribution shall be themed by building type — medical facilities yield medical items, military buildings yield weapons and ammunition, residential buildings yield food and general supplies.

### Roguelike Progression
- **DSR-11**: Difficulty shall be static within a single map but escalate between maps in a multi-map run, following roguelike conventions.
- **DSR-12**: The Survivor Market between maps shall function as a roguelike "shop phase" — a safe zone where survivors can trade, heal, and prepare before the next escalation.
- **DSR-13**: The grading system (S/A/B/C/D/F) shall evaluate performance holistically across objectives completed, casualties, speed, and resource efficiency.

### Entity & Physics Model
- **DSR-14**: Entities shall be sub-tile sized (radius 0.3–0.4 tiles) with float positions, allowing multiple entities to occupy the same tile simultaneously.
- **DSR-15**: All combat distance checks shall use float Euclidean distance, not integer tile distance, to ensure accurate hit detection for sub-tile entities.
- **DSR-16**: The hybrid movement model shall use grid-based pathfinding (A* on integer coordinates) for navigation while rendering smooth float-position movement for visual fidelity.

### AI Personality System
- **DSR-17**: The five AI personality types (Balanced, Aggressive, Cautious, Survivalist, Money-Driven) shall produce observably different behavior patterns — an Aggressive survivor shall engage in combat more frequently and at greater risk than a Cautious survivor under identical conditions.
- **DSR-18**: AI survivors shall communicate via a radio system for team awareness — sharing information about enemy positions, resource locations, and calls for help within communication range.
