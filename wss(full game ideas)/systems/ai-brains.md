# AI Brains System

Decision-making architecture for AI agent behavior, personality types, and squad coordination.

---

## Overview

> TBD — How do AI agents make decisions each frame/turn? Decision tree evaluation? Behavior tree? State machine? How often are decisions re-evaluated? How does local vs global information affect decisions?

---

## Personality Types

> TBD — Define and balance the four personality types (reuse from Wilderness Survival and MonsterCards):

- **Balanced:** Moderate risk tolerance, flexible strategy, jack-of-all-trades approach.
- **Aggressive:** High risk tolerance, prioritizes offense, seeks combat.
- **Defensive:** Low risk tolerance, prioritizes survival, avoids unnecessary combat.
- **Cautious:** Very low risk tolerance, extremely careful, prefers hiding/scavenging over fighting.

> TBD — How do personality types affect decision weights? Should there be random variance per agent even within the same type?

---

## Decision Tree (Fight/Flee/Scavenge/Barricade)

> TBD — What decisions are agents making each turn?

- **Fight:** Engage enemies in combat. When do agents choose to attack vs defend?
- **Flee:** Retreat from area. What triggers a retreat? Fleeing to safety or toward allies?
- **Scavenge:** Search for resources, loot, exploration. How long do agents scavenge in one area?
- **Barricade:** Build/maintain structures (IDEA 6). When do agents choose to barricade? Single-use or persistent?

> TBD — Decision weights per personality type. Example: Aggressive fights more, Defensive scavenges more, Cautious flees more.

---

## Agent Stats

> TBD — Full stat list and scaling:

- **Health:** Current/max health. Recovery mechanics?
- **Stamina:** Action point budget? Fatigue from running/fighting?
- **Ammo:** Per weapon or shared pool? Reload cost?
- **Damage:** Base damage stat. Weapon-specific modifiers?
- **Defense:** Armor rating? Damage reduction percentage?
- **Range:** Visual perception range. Different range for different actions?

> TBD — How do stats scale with difficulty/rounds? Do agents level up or become tougher over time?

---

## Squad Coordination

> TBD — How do agents work together?

- Do agents have designated roles (leader, medic, scout)?
- Can agents share information about enemy locations?
- Do agents move together or independently?
- Group attack mechanics — do agents focus fire on one target?
- Flanking/coordinated tactics — how sophisticated?

---

## Help Request & Response System

> TBD — Communication system (ties to IDEA 2 from design doc):

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
