# ADR-010: Three-Faction System

## Status: Accepted
## Date: February 2026

## Context
Need to define friend/foe relationships between entities. Affects combat targeting, AI decisions, and trading.

## Decision
Use a simple **three-faction system**: PLAYER_TEAM, HOSTILE, NEUTRAL.

## Details
- PLAYER_TEAM: Survivors controlled by AI. Cooperate, share vision, help each other.
- HOSTILE: Zombies, enemy humanoids (bandits, raiders, military remnants, scavengers). Attack PLAYER_TEAM on sight.
- NEUTRAL: Trader NPCs. Don't attack, can be traded with. Can be attacked (friendly fire is ON).
- Faction is a property of each entity.
- Combat targeting: entities only auto-target other factions (but friendly fire means stray shots can hit allies).

## Consequences
- Simple faction check for targeting: `attacker.faction !== target.faction` (or explicit rules)
- Friendly fire creates emergent risk in group combat
- Neutral entities need special AI handling (don't attack, approach for trading)
- Future expansion: faction reputation, allegiance shifts (Phase 7+)

## Dependencies
- Requires: Entity system (Phase 0)
- Enables: Combat targeting (Phase 1), Trading (Phase 3)
