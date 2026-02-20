# ADR-007: Real-Time Combat at 60 Ticks/Second

## Status: Accepted
## Date: February 2026

## Context
Need to choose between turn-based and real-time combat. WSS2 is a zero-player game where the observer watches AI make decisions.

## Decision
Combat is **real-time** at **60 ticks per second** with 3 weapon classes and simultaneous group combat.

## Details
- 3 weapon classes: Fists, Melee weapons, Guns
- Simultaneous group combat: all attackers in range hit at once per tick (cooldown permitting)
- Humanoid combat system: survivors and enemy humans use the same combat mechanics
- Noise mechanic: weapons generate noise that attracts enemies
- Armor system: equipped armor reduces damage, degrades on hit
- Cover system: directional cover on tiles reduces damage/hit chance
- Melee durability: melee weapons break after durability depletes
- Reload mechanics: guns have reload times, can move during reload, interrupt on damage/weapon switch
- Friendly fire: ON — full damage to allies

## Consequences
- Combat resolution happens every tick (need efficient damage calculation)
- Weapon cooldowns tracked per-entity in ticks
- Noise events create spatial alerts each tick weapons fire
- AI brains must evaluate combat state every tick (or use event interrupts)

## Dependencies
- Requires: Game loop (Phase 0), Entity system (Phase 0)
- Implementation: Phase 1
