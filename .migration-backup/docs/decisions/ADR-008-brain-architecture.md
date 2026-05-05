# ADR-008: Hybrid Tick + Event Brain Architecture

## Status: Accepted
## Date: February 2026

## Context
AI agents need a decision-making system. Need to balance responsiveness (react to threats immediately) with performance (don't overcompute).

## Decision
Use a **hybrid tick-based + event-driven** brain architecture.

## Details
- Default: Brain runs full Sense/Decide/Act every tick (60 decisions/sec)
- Fallback: Configurable throttle to every 5 ticks (12 decisions/sec) via debug toggle
- Event interrupts fire immediately regardless of tick schedule:
  - Took damage
  - Significant self-status change (very low health, out of ammo, stamina exhausted)
  - Radio-based events (ally died, help request) — requires radio item
- Decision priority: self-status first, team awareness gated behind radio item
- 5 personality types: Balanced, Aggressive, Cautious/Defensive, Survivalist, Money-Driven
- Brain interface: `Brain.decide(actor, world) -> Intent`
- Intent types: Move, Attack, Loot, Flee, Idle, TakeCover, ActivateObjective, HelpTeammate

## Consequences
- Each entity type needs a Brain implementation
- Performance scales linearly with entity count (tune throttle if needed)
- Radio item creates meaningful progression (team coordination unlocks over time)
- Help/revive is availability-based, NOT personality-based

## Dependencies
- Requires: Entity system (Phase 0), Combat system (Phase 1)
- Implementation: Phase 1
