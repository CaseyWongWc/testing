# Win Conditions System

Winning and losing mechanics. Portal evacuation is the primary win condition. Extraction score system determines evacuation probability.

**Locked Decision:** Portal evacuation — all living survivors must reach the portal to win.

---

## Overview

> TBD — How does the endgame flow work? Do agents need to reach a portal simultaneously or can they stagger? Does reaching the portal auto-win or trigger a final battle?

---

## Lose Condition

> TBD — Losing the game:

- **Lose:** All AI agents are dead (entire team eliminated).
- Game over state: Show defeat screen with stats (rounds survived, kills, final score).
- Can agents be permanently downed then revived, or is death permanent?
- Is there a "game over" threshold where < X agents survive makes winning impossible?

---

## Win Condition

> TBD — Winning the game (portal evacuation):

- **Win:** Portal becomes available AND all living survivors successfully reach and enter the portal.
- Portal location: Determined during map generation. Fixed or random location?
- Portal appearance: Invisible until discovered? Glowing? Requires activation?
- Evacuation sequence: Is it instant or does evacuation take time (agents boarding)?
- Can enemies block the portal or interrupt evacuation?

---

## Extraction Score System

> TBD — Score mechanics (IDEA 3 from design doc):

- Agents accumulate score from multiple sources:
  - **Zombie Kills:** X points per kill. Different point values per zombie type?
  - **Evil NPC Kills:** Y points (hostile humans worth more than zombies?).
  - **Portal/Spawner Destruction:** Z points per spawner destroyed.
  - **Rounds Survived:** +1 point per round? Or +10?
  - **Objectives Completed:** Bonus points for mission objectives?
- **Total Score:** Sum of all sources at game end.

> TBD — How does score relate to extraction probability? Is there a point threshold to unlock portal evacuation?

---

## Underdog Multiplier

> TBD — Multiplier system for fewer survivors (IDEA 3):

- **Formula:** As living agent count decreases, the extraction score multiplier increases.
  - All agents alive: 1.0x multiplier.
  - 1 agent dead: 1.1x multiplier.
  - 2 agents dead: 1.25x multiplier.
  - [Scale to be determined]
- **Design Intent:** Rewards teams that keep pushing despite losses. "If you survive long enough with few people, you WILL win from math."
- **Philosophy:** Makes for emotional moments ("we're down to 2 people but we can STILL win").

---

## Portal Unlock Requirements

> TBD — Portal activation mechanics:

- Does portal unlock automatically after X rounds?
- Does it require a certain score threshold?
- Does it require all spawners to be destroyed?
- Does portal unlock gradually (at 0%, 50%, 100% readiness) or trigger suddenly?
- Is portal location revealed to agents immediately or after discovery?
- Can there be multiple portals or just one per map?

---

## Connection to Other Systems

- **Spawners & Enemies:** Kill counts feed extraction score (Spawners & Enemies)
- **Combat:** Combat kills/deaths directly impact win probability (Combat)
- **Map Generation:** Portal location determined during generation (Map Generation)
- **Resources & Economy:** Resources affect survival odds which affect win probability (Resources & Economy)
- **AI Brains:** Agent decision-making can be influenced by proximity to portal (AI Brains)
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
- Should evacuation have a time limit (agents must leave before zone expansion)?
- Does score continue accumulating after portal unlock or does it freeze?
- Should final score affect next map difficulty or unlocks?
