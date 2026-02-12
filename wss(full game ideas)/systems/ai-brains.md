# AI Brains System

Decision-making architecture for AI agent behavior, personality types, and squad coordination.

---

## Overview

Each AI agent follows a per-tick decision loop: **Sense -> Decide -> Act**.

- **Sense:** The agent gathers local info (nearby enemies, loot, exits, objective compass direction).
- **Decide:** The brain picks an **Intent** based on current state, personality, and sensory input.
- **Act:** The intent is executed (movement, attack, pickup, interaction).

### Brain Interface

```
Brain.decide(actor, world) -> Intent
```

The Brain is an interface. Different implementations (balanced, aggressive, cautious, etc.) produce different decision weights but all return an Intent.

### Intent

An Intent is a data object representing the agent's chosen action for the current tick:

- `type`: Move | Attack | Loot | Flee | Idle
- `targetPos`: (x, y) coordinates for movement or area-based actions
- `targetEntityId`: ID of a specific entity (for Attack, Loot, etc.)

---

## Interaction State Machine

Each survivor has a small state machine for interactable objects (switches, objectives):

- **IDLE** -- Normal behavior, brain runs Sense/Decide/Act as usual.
- **ACTIVATING** -- Survivor is interacting with an object (e.g., activating a switch). Has `activate_target_id` and `activate_progress_ticks`.

### ACTIVATING Rules

- Enter ACTIVATING when a survivor is on the switch tile and decides to interact.
- Each tick in ACTIVATING: `progress += 1`.
- Cancel conditions:
  - Survivor moves (user input or AI decision to move)
  - Survivor is forced to move (knockback, later)
  - Switch tile no longer occupied
- Complete when `progress >= N`:
  - Mark objective complete
  - Fire event `SwitchActivated`

### AI Behavior During Activation (LOCKED)

- AI survivors **do not auto-cancel** activation if enemies approach.
- Once an AI survivor starts activating, it stays soft-locked until completion (or a forced-move mechanic is introduced later).
- While in ACTIVATING, the survivor may still be allowed to attack (optional) but cannot move.

---

## Compass Navigation

AI survivors use the **objective compass** as a heuristic:

- When not currently threatened or engaged, the AI moves "generally toward" the current objective using the compass direction.
- Compass direction is computed as `objective.target_pos - survivor.pos`.
- This prevents AI from wandering aimlessly in fog of war while still allowing reactive behavior when enemies appear.

---

## Personality Types

> TBD -- Define and balance the four personality types (reuse from Wilderness Survival and MonsterCards):

- **Balanced:** Moderate risk tolerance, flexible strategy, jack-of-all-trades approach.
- **Aggressive:** High risk tolerance, prioritizes offense, seeks combat.
- **Defensive:** Low risk tolerance, prioritizes survival, avoids unnecessary combat.
- **Cautious:** Very low risk tolerance, extremely careful, prefers hiding/scavenging over fighting.

> TBD -- How do personality types affect decision weights? Should there be random variance per agent even within the same type?

---

## Decision Tree (Fight/Flee/Scavenge/Barricade)

> TBD -- What decisions are agents making each turn?

- **Fight:** Engage enemies in combat. When do agents choose to attack vs defend?
- **Flee:** Retreat from area. What triggers a retreat? Fleeing to safety or toward allies?
- **Scavenge:** Search for resources, loot, exploration. How long do agents scavenge in one area?
- **Barricade:** Build/maintain structures (IDEA 6). When do agents choose to barricade? Single-use or persistent?

> TBD -- Decision weights per personality type. Example: Aggressive fights more, Defensive scavenges more, Cautious flees more.

---

## Agent Stats

> TBD -- Full stat list and scaling:

- **Health:** Current/max health. Recovery mechanics?
- **Stamina:** Action point budget? Fatigue from running/fighting?
- **Ammo:** Per weapon or shared pool? Reload cost?
- **Damage:** Base damage stat. Weapon-specific modifiers?
- **Defense:** Armor rating? Damage reduction percentage?
- **Range:** Visual perception range. Different range for different actions?

> TBD -- How do stats scale with difficulty/rounds? Do agents level up or become tougher over time?

---

## Squad Coordination

> TBD -- How do agents work together?

- Do agents have designated roles (leader, medic, scout)?
- Can agents share information about enemy locations?
- Do agents move together or independently?
- Group attack mechanics -- do agents focus fire on one target?
- Flanking/coordinated tactics -- how sophisticated?

---

## Help Request & Response System

> TBD -- Communication system (ties to IDEA 2 from design doc):

- What triggers a help request? (Low health? Surrounded? Found resources?)
- How do agents signal for help? (Radio? Proximity? Line of sight?)
- How do agents evaluate whether to respond to a help request?
  - Distance to requester?
  - Own current health/ammo?
  - Personality type modifiers?
  - Current task priority?
- Communication range/cooldown? Can agents spam requests?

---

## Connection to Other Systems

- **Combat:** Combat stats (damage, defense, health) tied to Combat system (Combat)
- **Fog & Vision:** Agent vision range determines what they can perceive (Fog & Vision)
- **Map Generation:** Agent pathfinding tied to terrain costs (Map Generation)
- **Spawners & Enemies:** Enemy AI may use similar decision tree (Spawners & Enemies)
- **Resources & Economy:** Agents need to evaluate item trades (Resources & Economy)
- **Win Conditions:** Agent decisions affect extraction probability and morale (Win Conditions)

---

## Open Questions

- Should AI agents have memory? What do they remember about explored areas, enemy locations, resource caches?
- Can agent personalities shift over the course of a game (trauma from losses, morale swings)?
- Should agents have communication cooldowns to prevent spam?
- How do agents prioritize objectives (survive > extract > loot > help teammates)?
- Can agents make "selfish" decisions that harm the team?
- How do agents evaluate risk when considering a help request?
- Should there be a "panic" or "controlled" state that agents can enter?
- Do agents have different vision accuracy at night vs day?
- Can agents learn/adapt to enemy behavior patterns?
