# "A Forgotten Place" -- Development Roadmap

> Updated to match locked design decisions from brainstorming sessions.

### Locked decisions (override older notes)

- Combat is **real-time** (60 ticks/sec)
- Movement is **hybrid**: grid-based world, smooth entity movement on top (ragdoll-style)
- AI pathfinds on grid, entities move smoothly in real-time
- **Stamina system**: fast recharge, drains hunger/thirst
- **World speed slider** in settings
- Win condition is **portal evacuation** (Rift Portal = exit to next map)
- **Corruption Nests** are enemy spawners (NOT rift portals)
- **Placeables** are survivor-built objects (barricades, traps, campfires)
- Fog is **shared team fog** with **remembered** fog
- Objectives: **6 types** (ActivateSwitch, Survive, Extract/ReachPortal, DestroyNests, Collect, Rescue)
- Objective visibility: **Option A** (AI knows all objectives from start, HUD does progressive text reveal)
- Objectives are **location-based, sequential, one at a time**
- Switch activation is **hold-to-activate** (N ticks, soft-locked)
- Survivors spawn **center of map**, portal in center, starts **SEALED**
- Compass points each survivor toward current objective (disabled in Hardcore mode)
- Portal uses **soft lock-in** (survivors enter one at a time, win when all living are evacuating)
- AI does **not auto-cancel** activation when enemies approach
- v0.1 map sizes: **30x30, 40x40, 60x60** (configurable, tied to difficulty)
- v0.1 survivor count: **1-5** (configurable)
- Combat: **3 weapon classes** (fists/melee/guns), noise mechanic, armor system, cover system
- Group combat is **simultaneous** (all attackers hit at once)
- **Humanoid combat** for all entities (survivors and enemy humans use same system)
- **Faction system**: PLAYER_TEAM / HOSTILE / NEUTRAL
- Difficulty: **static within maps**, **adaptive between maps** (roguelike escalation)
- **Charms/Lucky Items** affect difficulty (Personal/Team/World scope)
- Run structure: **Map 1 → Rift Portal → Map 2 (harder) → Rift Portal → Map 3...**
- **Survivor Market** between maps (safe zone, buy/sell, heal)
- Win/Lose: **two-level** (per-map portal extraction + full-run completion)
- **S/A/B/C/D/F grading system** for performance
- **Multi-camera system**: Observer Grid, Survivor Cam, Free Cam, Free Zoom
- Entity visuals: **modular sprite pieces** (paper-doll system, 5 layers)
- Entity size: **STILL DEBATING** (1-tile logical footprint vs variable hitboxes)
- Loot distribution: **TBD**
- Revive: **availability-based** (not personality-based, from Dinogen research)

---

*Notes:* Later phases are optional and can stay rough until v0.1 is complete.

---

## Phase 0: Foundation & Setup
> Separate the full game from the existing WSS prototype so assignments stay safe.

- [ ] New main menu / entry point for "A Forgotten Place"
- [ ] Shared core types & interfaces (separate from prototype)
- [ ] Base game loop architecture (tick/turn system)
- [ ] Basic grid rendering engine (reusable across biomes)

---

## Phase 1: Core Simulation
> One biome, Corruption Nests, AI squad with smooth movement on grid. The "proof of life" build.

- [ ] Single biome map generation (pick one to start -- Forest or Hills)
- [ ] Grid-based world with smooth entity movement on top (hybrid movement system)
- [ ] PlayerAI agents on the grid (movement, stats: health/stamina/hunger/thirst/ammo)
- [ ] Stamina system (fast recharge, drains hunger/thirst)
- [ ] Corruption Nests as enemy spawners (spawn waves of enemies from nests)
- [ ] Simple enemy type (basic zombie -- move toward nearest agent)
- [ ] Real-time combat loop (60 ticks/sec) with 3 weapon classes (fists/melee/guns)
- [ ] Noise mechanic (gunfire and actions attract enemies)
- [ ] Armor system and cover system
- [ ] Group combat: simultaneous (all attackers hit at once)
- [ ] Humanoid combat system (survivors and enemy humans use same system)
- [ ] Faction system: PLAYER_TEAM / HOSTILE / NEUTRAL
- [ ] Shared team fog-of-war + remembered fog (two-step: visible vs explored)
- [ ] Basic AI brain: fight / flee / scavenge decision tree
- [ ] AI pathfinds on grid, entities move smoothly in real-time
- [ ] Placeables: survivor-built objects (barricades, traps, campfires)
- [ ] Death & permadeath for agents
- [ ] Lose condition: all agents dead
- [ ] World speed slider in settings

---

## Phase 2: Game Loop & Winning
> Rift Portal extraction, objective unsealing, scoring, and a real ending.

- [ ] 6 objective types: ActivateSwitch, Survive, Extract/ReachPortal, DestroyNests, Collect, Rescue
- [ ] Objectives are location-based, sequential, one at a time
- [ ] Objective visibility: Option A (AI knows all objectives from start, HUD does progressive text reveal)
- [ ] Rift Portal starts SEALED in center of map; unseals after objectives complete
- [ ] Win condition: Rift Portal evacuation (portal = exit to next map)
- [ ] Portal soft lock-in (survivors enter one at a time, win when all living are evacuating)
- [ ] Compass points each survivor toward current objective (disabled in Hardcore mode)
- [ ] Switch activation: hold-to-activate (N ticks, soft-locked)
- [ ] Corruption Nest destruction as objective type
- [ ] Escalating enemy pressure (enemies get stronger over time within map)
- [ ] S/A/B/C/D/F grading system for per-map performance
- [ ] Basic HUD: round counter, score, objective status, compass
- [ ] Resource pickups on map (health, ammo, basic items)

---

## Phase 3: Day/Night & Survivor Market
> Add rhythm to the game -- safe moments vs. dangerous ones, plus between-map trading.

- [ ] Day/night cycle
  - [ ] Vision range changes (full day -> reduced night)
  - [ ] Enemy behavior shifts (more aggressive at night)
  - [ ] Visual indicator (sky color / overlay / UI clock)
- [ ] Survivor Market between maps (safe zone)
  - [ ] Buy/sell items, heal, restock
  - [ ] Neutral Faction NPCs as shopkeepers
  - [ ] Currency system (gold from kills, scavenged points)
- [ ] Charms/Lucky Items (Personal/Team/World scope, affect difficulty)
- [ ] AI trade evaluation per agent

---

## Phase 4: Biome Expansion
> Bring the world to life with variety.

- [ ] Biome 1: Lightly Forested Hills
- [ ] Biome 2: Dense Forest
- [ ] Biome 3: Desert
- [ ] Biome 4: Rocky Mountains
- [ ] Biome 5: City (+ biome mixing system)
- [ ] Biome 6: Snow Region
- [ ] Biome-specific structures & features
- [ ] Biome-specific resource distribution
- [ ] Terrain movement/visibility costs per biome

---

## Phase 5: Multi-Map Progression
> Turn single maps into a roguelike run across multiple levels.

- [ ] Run structure: Map 1 → Rift Portal → Map 2 (harder) → Rift Portal → Map 3...
- [ ] Rift Portal as map exit (completing objectives unseals portal)
- [ ] Procedural next-map generation (new biome, harder difficulty)
- [ ] Difficulty: static within maps, adaptive between maps (roguelike escalation)
- [ ] Survivor Market between each map
  - [ ] Safe zone: no enemies
  - [ ] Buy/sell items, heal, restock
  - [ ] Neutral Faction NPCs as shopkeepers
- [ ] Boss arena chance before market
- [ ] Win/Lose: two-level (per-map portal extraction + full-run completion)
- [ ] Revive system: availability-based (not personality-based, from Dinogen research)

---

## Phase 6: Advanced AI & Multi-Camera
> The big brain upgrade -- agents think locally, not globally. Multi-camera observation.

- [ ] Multi-camera system
  - [ ] Observer Grid (Diep.io-inspired split view of all survivors)
  - [ ] Survivor Cam (follow individual survivor)
  - [ ] Free Cam (detached camera, explore the map)
  - [ ] Free Zoom (zoom in/out on any area)
- [ ] Entity visuals: modular sprite pieces (paper-doll system, 5 layers)
- [ ] AI decision-making based on LIMITED local info only
- [ ] Independent exploration logic per agent
- [ ] Help request system (call for backup)
- [ ] Help response evaluation (should I go help or save myself?)
- [ ] Communication range (proximity? radio? line of sight?)
- [ ] Squad coordination behaviors

---

## Phase 7: Onslaught Zone & Faction Depth
> Late-game depth -- pressure mechanics and social dynamics.

- [ ] Onslaught zone (moving danger area)
  - [ ] Zone movement triggers
  - [ ] Damage to agents inside the zone
  - [ ] Forces relocation and tactical decisions
- [ ] Expanded faction interactions
  - [ ] Faction types: PLAYER_TEAM, HOSTILE (zombies + hostile humans), NEUTRAL (traders)
  - [ ] Faction relationships and allegiance shifts
  - [ ] Rival survivor groups

---

## Phase 8: Horror & Polish
> Make it FEEL like survival horror, not just a sim.

- [ ] Atmospheric visuals (darkness, fog, weather effects)
- [ ] Sound/detection mechanics (noise attracts enemies, ties into noise mechanic)
- [ ] Special enemy types (runners, tanks, special infected, night-only)
- [ ] Environmental hazards (fires, collapsed buildings, traps)
- [ ] Weather system (hypothermia in snow, heat in desert)
- [ ] Performance metrics & post-game stats
- [ ] Victory / defeat screens with full run summary and S/A/B/C/D/F grade

---

## Open Design Questions
> To be resolved before or during each phase.

### Resolved

- ~~Combat system~~ → Real-time, 60 ticks/sec, 3 weapon classes, simultaneous group combat
- ~~Movement system~~ → Hybrid: grid-based world, smooth entity movement
- ~~Win condition~~ → Rift Portal evacuation + full-run completion
- ~~Spawner type~~ → Corruption Nests (enemy spawners, not portals)
- ~~Fog system~~ → Shared team fog with remembered fog
- ~~Objective types~~ → 6 types, sequential, location-based
- ~~Faction system~~ → PLAYER_TEAM / HOSTILE / NEUTRAL
- ~~Market system~~ → Survivor Market between maps
- ~~Scoring~~ → S/A/B/C/D/F grading system
- ~~Camera system~~ → Observer Grid, Survivor Cam, Free Cam, Free Zoom
- ~~Barricading~~ → Yes, via Placeables system (barricades, traps, campfires)
- ~~Revive system~~ → Availability-based (from Dinogen research)

### Still Open

- Entity size: 1-tile logical footprint vs variable hitboxes
- Loot distribution system: TBD
- Zombie type roster: what are all the enemy types?
- Onslaught zone behavior: gradual damage or instant kill?
- Ammo system: finite per weapon? Shared pool?
- Crafting: yes/no? If yes, how deep?
- Friendly fire: on or off?
- Reinforcements: can new agents arrive mid-game?
- Rescued civilians: do they join the squad or just add score?
- Communication system details (radio range, cooldowns, etc.)

---

*Last updated: Feb 2026*
*Status: Locked decisions from brainstorming sessions applied*
