# Combat System

Real-time combat engine with 60 ticks per second. Agents and enemies engage in simultaneous real-time action resolution.

**Locked Decision:** 60 ticks/sec (real-time), reuse RogueLike combat math.

---

## Overview

The combat system runs inside the main tick loop at 60 ticks/sec (configurable between 20-60, recommended 60). Each tick, the `CombatSystem` processes all pending attacks, resolves hits against targets, applies cooldowns, and handles death. v0.1 keeps combat simple: melee and ranged basics only.

Per-tick combat flow:
1. Each actor with an Attack intent has their weapon checked for cooldown readiness.
2. If cooldown is zero, the attack resolves: target takes damage.
3. Cooldown resets on the weapon after firing.
4. If target health reaches zero, mark as dead (cleanup phase removes the entity).

---

## Weapon Data Model

Weapons are defined with the following stats:

- `damage` -- base damage per hit
- `range` -- effective range in tiles (melee = 1, ranged = variable)
- `cooldown` -- ticks between attacks (e.g., 30 ticks = 0.5 seconds at 60 ticks/sec)
- `ammo` -- optional in v0.1 (can be omitted or set to unlimited for simplicity)

v0.1 weapon categories:
- **Melee:** range 1, moderate damage, short cooldown
- **Ranged:** range 3-6+, variable damage, longer cooldown, ammo optional

---

## CombatSystem

The `CombatSystem` is responsible for:
- Resolving hit attempts (attacker vs target based on range and weapon)
- Managing weapon cooldowns (decrement each tick, allow attack when zero)
- Processing death (mark entity as dead when health <= 0)
- Integrating with the cleanup phase to remove dead entities and trigger loot drops

---

## Damage & Defense Formulas

> TBD -- Exact formulas for damage calculation (attacker damage - defender defense = net damage?). How does armor/defense rating scale with level or equipment?

---

## Weapons (Melee vs Ranged)

v0.1 scope: one or two melee weapons and one or two ranged weapons to prove the system works. Full weapon roster is a later phase.

- **Melee:** Short range (1 tile), faster cooldown, no ammo required.
- **Ranged:** Longer range (3+ tiles), slower cooldown, ammo optional in v0.1.

> TBD -- Full weapon list (bat, axe, knife, pistol, shotgun, rifle, etc.) with specific stat values.

---

## Ammo System

v0.1: Ammo is optional. Weapons can fire without ammo tracking to reduce complexity. If ammo is included, it is a simple counter on the weapon that decrements per shot.

> TBD -- Is ammo finite per weapon or shared pool per agent? Reload mechanics? Can ammo be crafted or only looted?

---

## Attack Timing (Cooldowns/Windup)

Attacks use a cooldown system measured in ticks. After an attack resolves, the weapon enters cooldown for N ticks before it can fire again. No windup in v0.1.

- Melee cooldown: shorter (e.g., 20-30 ticks)
- Ranged cooldown: longer (e.g., 40-60 ticks)

> TBD -- Windup/recovery frames? Can agents interrupt each other? Does melee have different timing than ranged beyond cooldown length?

---

## Hit Detection

> TBD -- How does hit chance work? Accuracy stat? Range modifiers? Line of sight required? Can agents miss? How does accuracy scale with distance and weapon type?

---

## Friendly Fire

> TBD -- Is friendly fire on or off? If on, how does it affect squad tactics? Risk/reward of clustering vs spreading out?

---

## Connection to Other Systems

- **Weapons & Equipment:** Tied to Resources & Economy (items, drops, trading)
- **Agent Stats:** Health, Ammo, Damage, Defense from AI Brains
- **Fog of War:** Vision Range affects who can attack whom (Fog & Vision)
- **Win Conditions:** Kill score contributes to Extraction probability (Win Conditions)
- **Day/Night Cycle:** Night might reduce accuracy or vision range for ranged attacks (Day/Night Cycle)
- **Spawners & Enemies:** Zombie/enemy types use similar combat math (Spawners & Enemies)

---

## Open Questions

- How do agents queue/interrupt actions mid-combat?
- Should certain weapon types have passive bonuses (shotgun knockback, rifle piercing)?
- Can agents take cover and gain defense bonuses?
- How does agent confusion or panic affect aim/damage during combat?
- Stagger/stun mechanics? Can heavy hits interrupt attacks?
- Does stamina cost apply to attacking? Running and attacking simultaneously?
- How does combat scale when 20+ agents and 50+ zombies are fighting at once?
