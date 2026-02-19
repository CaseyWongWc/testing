# AI Brains System

Decision-making architecture for AI agent behavior, personality types, and squad coordination.

---

## Overview

The game runs in **real-time at 60 ticks/sec**. Each AI agent follows a per-tick decision loop: **Sense -> Decide -> Act**.

- **Sense:** The agent gathers local info (nearby enemies, loot, exits, objective compass direction).
- **Decide:** The brain picks an **Intent** based on current state, personality, and sensory input.
- **Act:** The intent is executed (movement, attack, pickup, interaction).

The brain architecture is a **hybrid of tick-based evaluation + event-driven reactions**. Every tick the brain runs the full Sense/Decide/Act loop, but high-priority events (taking damage, hearing gunfire, ally downed) can interrupt and force immediate re-evaluation. This hybrid approach is the starting point and still being refined.

### World Speed Slider

Game speed is configurable in settings. The brain tick rate scales proportionally with game speed — if the player sets the game to 2x speed, brains evaluate twice as fast.

### Brain Interface

```
Brain.decide(actor, world) -> Intent
```

The Brain is an interface. Different implementations (balanced, aggressive, cautious, survivalist, money-driven) produce different decision weights but all return an Intent.

### Intent

An Intent is a data object representing the agent's chosen action for the current tick:

- `type`: Move | Attack | Loot | Flee | Idle | TakeCover | ActivateObjective | HelpTeammate
- `targetPos`: (x, y) coordinates for movement or area-based actions
- `targetEntityId`: ID of a specific entity (for Attack, Loot, etc.)

---

## Agent Stats

- **Health:** Current/max health. No auto-recovery — requires consumable items to heal.
- **Stamina:** Fast-recharge resource. Drains quickly when sprinting. Low stamina increases hunger/thirst drain rate.
- **Ammo:** Tracked per-weapon type, not a shared pool. Each weapon draws from its own ammo reserve.
- **Strength:** Affects melee damage bonus.
- **Defense:** Base damage reduction.
- **Speed:** Base movement speed.
- **Accuracy:** Affects ranged hit chance.
- **Morale:** Affects flee threshold and combat effectiveness. Low morale makes agents more likely to flee and less effective in combat.

---

## Stamina System

Stamina is a fast-recharge resource that governs movement intensity.

- Sprinting drains stamina quickly.
- Walking allows stamina to recharge passively.
- When stamina is low, hunger and thirst drain faster (the agent is physically exhausted).
- AI agents need stamina management logic: sprint when fleeing or closing distance in combat, walk when exploring or scavenging to conserve energy.
- Personality affects stamina usage — aggressive agents sprint more freely, cautious agents conserve stamina.

---

## Personality Types & Weapon Selection

Each AI agent has a personality type that drives decision weights and weapon selection priority. Brain type overrides weapon selection priority.

### Balanced

- Moderate risk tolerance, flexible strategy.
- Will use whatever weapon fits the situation — adapts loadout to current needs.
- No strong preference for conserving or spending resources.

### Aggressive

- High risk tolerance, prioritizes offense.
- Goes all-in with best available weapon, seeks combat actively.
- Wastes ammo — fires freely without resource conservation.

### Cautious/Defensive

- Very low risk tolerance, prioritizes survival.
- Saves ammo for emergencies, prefers melee or fists to conserve resources.
- Avoids unnecessary combat, repositions to safer ground.

### Survivalist

- Hoards resources obsessively.
- Uses the cheapest option available — bare minimum to get the job done.
- Rarely engages unless forced, prioritizes scavenging and stockpiling.

### Money-Driven

- Calculates cost-benefit of each engagement.
- Won't waste expensive ammo on low-value targets.
- Weighs the economic value of combat (loot potential vs ammo spent).

---

## Decision Tree

### Fight

Engage enemies in combat.

- **Conditions:** Health > 30% AND have weapon AND enemy in range.
- Personality modifies aggression threshold — aggressive agents may fight at lower health, cautious agents disengage earlier.

### Flee

Retreat from the area toward safety or allies.

- **Conditions:** Health < 30% OR out of ammo against ranged threats OR morale low.
- Flee direction: toward allies if possible, otherwise away from threats.

### Scavenge

Search for resources and loot.

- **Conditions:** No immediate threats AND resources low.
- Duration depends on area richness and personality — survivalists scavenge longer.

### Barricade

Build or reinforce defenses when in a defensible position.

- **Conditions:** In defensible position AND have building resources.
- This is a **v0.2+ feature** — not available in initial release.

### Activate Objective

Move toward and activate an objective switch.

- **Conditions:** Path to objective is relatively safe AND no higher-priority threats.
- Uses compass navigation to route toward the objective.

### Help Teammate

Respond to nearby allies in danger.

- **Conditions:** Ally within range is in danger AND agent has capacity to help.
- **Availability-based, NOT personality-based.** Any agent that can help will attempt to help regardless of personality. This is a key insight from Dinogen Online research — help responses should be universal, not gated by personality.

---

## Cover-Seeking Behavior

Ties to the combat cover system.

- **v0.1:** Cover is player-controlled only. AI agents do not seek cover.
- **v0.2+ (stretch goal):** AI gains a `TAKE_COVER` state. When implemented, AI evaluates nearby cover tiles during ranged combat and repositions behind cover when under fire.

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

### Objective Visibility (DECIDED)

- AI survivors know all objectives and their locations from the start of the game.
- Compass arrows point to objective areas immediately.
- AI already has full objective info to plan routes — no discovery mechanic needed for AI.
- **Hardcore mode variant:** Compass is disabled, forcing pure exploration.

---

## Squad Coordination

- Agents share information about enemy locations when within communication range.
- Agents generally move together but can split based on objectives or personality.
- Group attack mechanics — agents focus fire on the same target when engaging as a squad.
- Flanking and coordinated tactics are a stretch goal for later versions.

---

## Help Request & Response System

- **Triggers:** Low health, surrounded by enemies, ally downed nearby.
- **Signal method:** Proximity-based — agents within a communication range hear the request.
- **Response evaluation:** Availability-based. Any agent that can respond will respond. Distance and own health/ammo are factored in, but personality type does **not** gate willingness to help.
- **Communication cooldown:** Requests have a cooldown to prevent spam.

### Revive Mechanic

- Revive is **availability-based, not personality-based** (per Dinogen Online research).
- Any nearby survivor with available resources will attempt to revive a downed ally.
- No personality check needed — reviving is a baseline behavior for all agents.

---

## Connection to Other Systems

- **Combat:** Combat stats (health, defense, strength, accuracy) tied to Combat system.
- **Fog & Vision:** Agent vision range determines what they can perceive.
- **Map Generation:** Agent pathfinding tied to terrain costs.
- **Spawners & Enemies:** Enemy AI may use similar decision tree.
- **Resources & Economy:** Agents evaluate item trades and ammo cost-benefit.
- **Win Conditions:** Agent decisions affect extraction probability and morale.
- **Cover System:** Cover-seeking behavior ties to combat cover tiles.

---

## Resolved Questions

- **Personality types:** Five types defined — Balanced, Aggressive, Cautious/Defensive, Survivalist, Money-Driven.
- **Decision tree:** Fight/Flee/Scavenge/Barricade/ActivateObjective/HelpTeammate with concrete conditions.
- **Agent stats:** Health, Stamina, Ammo, Strength, Defense, Speed, Accuracy, Morale.
- **Objective visibility:** AI knows all objectives from the start. Compass points immediately.
- **Help/Revive:** Availability-based, not personality-based.
- **Real-time vs turn-based:** Real-time at 60 ticks/sec with hybrid tick + event-driven brain.

## Open Questions

- Should AI agents have memory? What do they remember about explored areas, enemy locations, resource caches?
- Can agent personalities shift over the course of a game (trauma from losses, morale swings)?
- How do agents prioritize objectives (survive > extract > loot > help teammates)?
- Can agents make "selfish" decisions that harm the team?
- Should there be a "panic" state that agents can enter under extreme stress?
- Do agents have different vision accuracy at night vs day?
- Can agents learn/adapt to enemy behavior patterns?
- How does the hybrid tick/event brain perform under high entity counts? May need throttling.
- What is the exact stamina recharge rate and sprint drain rate?
- How does morale recover — slowly over time, or only from positive events?
