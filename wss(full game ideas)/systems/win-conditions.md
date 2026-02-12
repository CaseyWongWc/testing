# Win Conditions System

Winning and losing mechanics. Portal evacuation is the primary win condition. Objectives must be completed to unlock the portal.

**Locked Decision:** Portal evacuation -- all living survivors must reach the portal to win. Portal starts LOCKED, unlocked by completing objectives.

---

## Overview

The portal starts LOCKED in the center of the map. Survivors complete location-based objectives sequentially (one at a time) to unlock the portal. Once unlocked, all living survivors must reach the portal to evacuate. A soft lock-in rule means survivors enter one at a time -- they do not need to be on the portal simultaneously. The game transitions through states: RUNNING -> CUTSCENE -> END.

---

## Portal States

- **LOCKED** -- Portal exists as an inactive floor tile. Survivors can walk over it but nothing happens. Unlocked when all objectives are complete.
- **ACTIVE** -- Portal is open for evacuation. Survivors can begin the evacuation process.

---

## Survivor States

- **RUNNING** -- Normal gameplay, survivor is alive and active.
- **EVACUATING** -- Survivor has entered the active portal and is boarding (evacuation delay in progress).
- **DEAD** -- Survivor has been killed. Removed from the must-evacuate set.

---

## Portal Evacuation (LOCKED Decision)

All living survivors must reach the portal to win. Details:

- **Soft lock-in rule:** Survivors do not need to be on the portal simultaneously. They enter one at a time.
- **evacuation_delay_ticks:** 30-120 ticks per survivor (for a "helicopter boarding" feel). Configurable.
- **Win trigger:** When all living survivors have status EVACUATING or have completed evacuation.
- **Edge case:** If an evacuating survivor dies during the delay, remove them from the must-evacuate set. Remaining living survivors still need to evacuate.

### Parameters

- `portal_requires_all_survivors`: toggle (default true)
- `evacuation_delay_ticks`: 30-120 ticks (configurable)

---

## Lose Condition

- **Lose:** All AI agents are dead (entire team eliminated).
- Game over state: Show defeat screen with stats (rounds survived, kills, final score).

> TBD -- Can agents be permanently downed then revived, or is death permanent? Is there a threshold where < X agents survive makes winning impossible?

---

## Objective System

Objectives are **location-based, sequential, one at a time, compass-guided**.

### Core Rules

- Objectives are location-based (a tile or zone on the map).
- Objectives appear one at a time (sequential chain).
- Completing the current objective spawns the next.
- After the objective chain is complete, the portal unlocks (`Portal.state = ACTIVE`).
- Fog of war stays meaningful, but each survivor has a **compass indicator** pointing to the current objective.

### ObjectiveManager

- `currentObjectiveIndex` -- which objective is currently active
- `objectiveQueue` -- ordered list of all objectives for this run
- Emits events: `ObjectiveStarted`, `ObjectiveCompleted`, `AllObjectivesCompleted`
- When `AllObjectivesCompleted` fires: `Portal.state = ACTIVE`

### Per-Tick Integration

1. `objectiveManager.update(world)`
2. If active objective complete -> advance to next
3. If all objectives complete -> `portal.state = ACTIVE`
4. Portal soft-evac rules take over once portal is active

### Objective Data Model

- `type` -- objective type identifier
- `target_pos` -- (x, y) or `zone_center` + `zone_radius`
- `status`: IN_PROGRESS | COMPLETE
- `progress` -- optional counter/timer

---

## v0.1 Objective Types

### ActivateSwitch (Primary for v0.1)

A Switch entity exists at a coordinate. A survivor must stand on the tile and hold to activate.

- **Hold-to-activate:** Takes N ticks to complete (LOCKED decision).
- `switch_activate_ticks`: 60 (at 60 ticks/sec = 1 second). Configurable.
- While activating, the survivor is **soft-locked** in place.
- A **circular progress indicator** fills up (white, transparent).

**Cancel conditions:**
- Survivor moves (user input)
- Survivor is forced to move (knockback, later)
- Survivor leaves the tile

**AI behavior during activation (LOCKED):**
- AI survivors do **not auto-cancel** activation if enemies approach.
- Once started, the AI stays soft-locked until completion.

### HoldZone

All living survivors must stand inside a zone for N seconds/ticks.

### CarryItem

Pick up an item at Point A and deliver to Point B (often the portal or a drop-off tile).

---

## Expandable Objective Types (Same Framework)

All share the same interface: `isComplete(world)`, `getTarget(world)`, `onTick(world)`.

- **RescueNPC** -- Survivor reaches NPC tile, NPC becomes "rescued" (or follows). Variant of CarryItem with escort behavior.
- **HoldZone** -- All living survivors inside zone AND timer reaches N, OR kill count inside zone.
- **DeliverItem** -- Item picked up at A and delivered to B.
- **DestroyTarget** -- Target entity HP reaches 0.

---

## Compass Indicator

Each survivor renders a pointer to the current objective's target position.

- For `TargetPos`: direction = `targetPos - survivorPos`
- For `TargetZone`: direction = `zoneCenter - survivorPos`
- AI uses the compass as a heuristic (move "generally toward" objective when not threatened).

---

## Objective Chain Settings

- `objective_count`: 3-5 (per run)
- `objective_sequence_mode`: FIXED | RANDOM_FROM_POOL
- `compass_enabled`: true (default)
- `portal_unlock_rule`: AFTER_OBJECTIVES | ALWAYS_UNLOCKED (debug)

---

## Win Cutscene

A stub for the win sequence:

- **CutsceneManager** handles the transition.
- Sequence: fade -> explosion -> helicopter -> fade to black
- Game state transitions: RUNNING -> CUTSCENE -> END

### Game States

- **RUNNING** -- Normal gameplay in progress.
- **CUTSCENE** -- Win/lose cutscene playing. No gameplay input processed.
- **END** -- Game is over. Show results screen.

---

## Extraction Score System

> TBD -- Score mechanics (IDEA 3 from design doc):

- Agents accumulate score from multiple sources:
  - **Zombie Kills:** X points per kill. Different point values per zombie type?
  - **Evil NPC Kills:** Y points (hostile humans worth more than zombies?).
  - **Portal/Spawner Destruction:** Z points per spawner destroyed.
  - **Rounds Survived:** +1 point per round? Or +10?
  - **Objectives Completed:** Bonus points for mission objectives?
- **Total Score:** Sum of all sources at game end.

> TBD -- How does score relate to extraction probability? Is there a point threshold to unlock portal evacuation?

---

## Underdog Multiplier

> TBD -- Multiplier system for fewer survivors (IDEA 3):

- **Formula:** As living agent count decreases, the extraction score multiplier increases.
  - All agents alive: 1.0x multiplier.
  - 1 agent dead: 1.1x multiplier.
  - 2 agents dead: 1.25x multiplier.
  - [Scale to be determined]
- **Design Intent:** Rewards teams that keep pushing despite losses.

---

## Connection to Other Systems

- **Spawners & Enemies:** Kill counts feed extraction score (Spawners & Enemies)
- **Combat:** Combat kills/deaths directly impact win probability (Combat)
- **Map Generation:** Portal location determined during generation, center of map (Map Generation)
- **Resources & Economy:** Resources affect survival odds which affect win probability (Resources & Economy)
- **AI Brains:** Agent decisions affected by compass direction and objective proximity (AI Brains)
- **Day/Night Cycle:** Portal may only be accessible at certain times (Day/Night Cycle)

---

## Open Questions

- Should there be intermediate win states (partial evacuation, rescue of some agents)?
- Can agents choose to not evacuate and continue playing (infinite mode)?
- Should there be a score/ranking system after winning (leaderboards)?
- How does the underdog multiplier scale exactly (linear, exponential)?
- Should there be "hard" loss conditions (e.g., onslaught zone overtakes whole team)?
- Do different biomes have different portal unlock mechanics?
- Can the portal be destroyed by enemies?
- Does score continue accumulating after portal unlock or does it freeze?
- Should final score affect next map difficulty or unlocks?
