# God System — LLM-Assisted Asynchronous Director

**Status**: UNSTABLE — high potential, many open handles  
**Phase**: Post-Phase 4 (optional add-on after all core phases complete)  
**Inspiration**: RimWorld AI Storytellers, Left 4 Dead AI Director, AI Dungeon Masters

---

## Overview

The God System is an optional, toggleable layer that lets an LLM (ChatGPT) act as an asynchronous game director. It observes the current game state and alters parameters for upcoming nights. The user (Observer) can interact with the God System through a dedicated side panel in the game UI.

The God System does NOT replace existing game systems — it layers on top of them. It can be activated pre-game or toggled mid-run from a separate panel.

---

## Core Loop

```
Night N plays out
       ↓
God receives a narrative snapshot of Night N
       ↓
God proposes parameter changes for Night N+1
       ↓
Finalization Day — Observer reviews, approves/edits/rejects changes
       ↓
Night N+1 plays out with approved changes applied
       ↓
(repeat)
```

The one-day buffer between proposal and application serves three purposes:
1. **Balance check** — Observer (or automated sanity-check) can reject game-breaking changes
2. **Tension building** — Survivors and the viewer know something is coming but not what
3. **Narrative pacing** — Creates a natural rhythm tied to the day/night cycle

---

## What the God Sees (Input Snapshot)

The God receives a **narrative summary**, not raw tile data. The LLM works better with natural language context.

Example snapshot:
> "Night 3 has ended. 4 of 6 survivors remain. Morale is low after losing two members to a zombie horde near the hospital. Ammo is critically low — only 12 rounds shared across the group. One survivor (Cautious personality) is injured at 35% health. The team cleared one Corruption Nest but two remain. Weather is clear. The nearest Rift Portal is 18 tiles northeast, still sealed (2/3 objectives complete). Gold reserves: 47."

Structured data backing the narrative:
- Survivor count, health, morale, personality types, positions
- Resource levels (ammo, food, water, medical, gold)
- Enemies killed, nests destroyed, objectives completed
- Current round/map number, extraction probability
- Recent notable events (deaths, boss fights, close calls, discoveries)
- Weather and time-of-day state

---

## What the God Can Change (Parameter Whitelist)

The God picks from a bounded menu of knobs with min/max ranges. It cannot generate arbitrary code or modify core game logic.

| Parameter | Range | Example |
|---|---|---|
| Zombie spawn rate multiplier | 0.5x – 3.0x | "Double zombie spawns next night" |
| Special enemy unlock | boolean per type | "Introduce Brute zombie variant" |
| Boss spawn | boolean + which boss | "Spawn Hive Mother at nest #2" |
| Weather | enum (clear/rain/fog/blizzard/heatwave) | "Trigger blizzard" |
| Resource drop rate | 0.25x – 2.0x | "Halve ammo drops" |
| Loot quality modifier | -2 to +2 | "Improve loot quality by 1 tier" |
| Vision modifier | 0.5x – 1.5x | "Fog rolls in, -30% vision range" |
| Faction event | enum list | "Mercenary patrol appears from the south" |
| Portal activation | specific portal IDs | "Activate dormant east portal" |
| Morale event | enum list | "Survivors find a hopeful note, +10 morale" |
| Day length modifier | 0.5x – 2.0x | "Shorter days, longer nights" |
| Custom entity spawn | see Custom Entities section | "Place a wandering hermit NPC" |

### Change Budget

The God can modify a maximum of **3 parameters per night cycle**. This forces strategic choices and prevents total chaos stacking (no 3x spawns + blizzard + boss + no ammo all at once).

---

## Custom Entities

This is the wildest part of the God System. The God **cannot** edit existing entity behaviors (survivors, zombies, hostile humans keep their base AI). But the God **can** add new entities to the map.

### How Custom Entities Work

1. **Sprite Selection** — God chooses from appropriate sprite sheets (humanoid, creature, object categories)
2. **Behavior Module** — Each custom entity gets an empty behavior slot. The God can either:
   - **Pick from presets**: Patrol, Wander, Guard Area, Follow Path, Flee From Players, Trade, Ambush, etc.
   - **Create a custom behavior**: The LLM writes a new behavior using the existing Brain interface (same API as survivor/zombie brains). This is sandboxed — it can only use approved action primitives (move, attack, flee, interact, speak, drop item, etc.)
3. **Stats** — Health, damage, speed, vision range — all within predefined bounds per entity category
4. **Faction** — PLAYER_TEAM, HOSTILE, or NEUTRAL

### Custom Entity Download System

If a custom entity:
- Has existed for at least one full night cycle without bugs/crashes
- Uses only approved action primitives
- Has been validated by the sandbox

Then it can be **downloaded** from the God Panel:
- **During the game**: If the entity is still alive and bug-free
- **After the game ends**: From the run summary/replay screen

Downloaded entities get saved as reusable templates that can be:
- Spawned in future God System sessions
- Shared between players (if multiplayer is ever added)
- Added to a community entity library

---

## Benevolence Slider

Controls how helpful vs. harmful the God's interventions tend to be.

```
WRATHFUL ←————————————→ BENEVOLENT
  -5    -4  -3  -2  -1   0   +1  +2  +3  +4   +5
```

- **-5 (Wrathful)**: God leans toward harder spawns, worse weather, scarcer resources
- **0 (Neutral)**: God makes balanced, story-driven decisions
- **+5 (Benevolent)**: God leans toward helpful events, supply drops, easier encounters

The slider biases the LLM's prompt but doesn't hard-lock it — a Benevolent God might still throw a challenge if the story calls for it, just less frequently.

### Benevolence Wildcards

- **Manual setting**: Observer sets the slider before the game or between nights
- **Random wildcard**: A dice button randomizes the benevolence for that particular night
- **Extended access wildcard**: If the wildcard toggle is left ON, the God gains access for the **next two nights** instead of one — meaning it can plan a two-night arc (setup night → payoff night) without the Observer reviewing in between. High risk, high reward for storytelling.

---

## Wildcard Dice (Self-Prompting Mode)

When the Observer presses the **Wildcard Dice** button, ChatGPT self-prompts — it generates its own creative direction without Observer input. The God reads the game state and decides independently what would make the most interesting story.

This is essentially the "autonomous storyteller" mode (like RimWorld's Cassandra Classic), but triggered on-demand rather than always-on.

The Wildcard Dice can be:
- **One-shot**: Press once, God self-prompts for one night
- **Streak mode**: Leave it on, God self-prompts every night until turned off
- **Combined with benevolence wildcard**: Both randomized = maximum chaos/surprise

---

## God Modes (Phased Implementation)

### Mode 1: Manual Sliders (Phase 2 prototype)
- No LLM at all
- Observer manually adjusts 3-5 parameter sliders between nights
- Proves the "play → modify → play with changes" loop is fun
- Cheapest to build, validates the core concept

### Mode 2: LLM Suggests, Human Approves (Phase 4+)
- LLM reads game state and proposes changes
- Observer reviews in the God Panel, can approve/edit/reject each change
- Finalization day buffer applies
- This is the default "God System" experience

### Mode 3: Fully Autonomous LLM (Phase 5+)
- LLM acts alone with no human in the loop
- Essentially an AI Storyteller like RimWorld
- Wildcard Dice in permanent streak mode
- Observer can still pause and override if needed

---

## Story Score

The God gets scored not on difficulty, but on **drama and entertainment value**.

Factors that increase the God's story score:
- Close calls (survivors barely escaping)
- Last-second rescues or revivals
- Dramatic reversals (things look hopeless → clutch moment)
- Interesting variety (not the same event type every night)
- Survivor personality conflicts creating tension
- A satisfying narrative arc across the run

Factors that decrease the story score:
- Total party wipe in the first few nights (boring)
- Survivors cruising with zero tension (boring)
- Repetitive events (blizzard every single night)
- Stacking extreme changes back-to-back with no breathing room

The story score is displayed at the end of the run alongside the survivor grade (S/A/B/C/D/F).

---

## Safety Rails

- **Change budget**: Max 3 parameter changes per night
- **Escalation cooldown**: Can't stack extreme changes in consecutive nights (e.g., after a 3x spawn night, next night caps at 1.5x)
- **Survivor fairness floor**: Some minimum resource threshold the God can't push below (at least 1 weapon and basic supplies must remain accessible somewhere on the map)
- **Custom entity sandbox**: LLM-created behaviors run in a validated sandbox; if they crash or produce invalid actions, the entity gets removed and flagged
- **Kill switch**: Observer can disable the God System at any time mid-run; all God-introduced changes revert over 2 nights (gradual, not instant)

---

## UI: The God Panel

A toggleable side panel in the game UI (similar to an in-game console or chat panel).

Contents:
- Current benevolence slider position
- Wildcard dice button
- Proposed changes for next night (with approve/edit/reject per change)
- History log of all God actions taken this run
- Custom entity library (browse, download, manage)
- Story score (running total)
- God System on/off toggle

The God Panel can be activated:
- **Pre-game**: In the run configuration screen
- **In-game**: From a toggle button in the Observer UI

---

## Dependencies

This system requires the following to be functional before implementation:
- Core game loop (Phase 0-1)
- Day/night cycle (Phase 1-2)
- Spawner/difficulty systems (Phase 1-2)
- Weather system (Phase 2)
- Stable parameter API for all tunable game values (Phase 2-3)
- Entity behavior interface / Brain API (Phase 1)

---

## Open Questions

- [ ] Should the God be able to communicate with survivors in-game (e.g., mysterious voice, written messages, signs)?
- [ ] Can the God place physical structures (walls, barricades, traps) or only entities?
- [ ] Should there be a "God vs. God" mode where two LLMs compete — one helping survivors, one trying to kill them?
- [ ] How does the God System interact with the Survivor Market between maps?
- [ ] Should custom entity behaviors persist across maps in a multi-map run?
- [ ] What's the LLM token budget per night cycle? (Cost management)
- [ ] Should the God have a "personality" setting like RimWorld storytellers (Dramatic, Chaotic, Fair, Sadistic)?
