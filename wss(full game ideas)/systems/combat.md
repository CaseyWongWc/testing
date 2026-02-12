# Combat System

Real-time combat engine with 60 ticks per second. Agents and enemies engage in simultaneous turn-based action resolution.

**Locked Decision:** 60 ticks/sec (real-time), reuse RogueLike combat math.

---

## Overview

> TBD — High-level combat flow: how does a 60 tick/sec loop work with action queuing, cooldowns, and damage resolution? Is every agent/enemy acting every frame or do they have action budgets?

---

## Damage & Defense Formulas

> TBD — Exact formulas for damage calculation (attacker damage - defender defense = net damage?). How does armor/defense rating scale with level or equipment?

---

## Weapons (Melee vs Ranged)

> TBD — Define melee weapons (bat, axe, knife, etc.) vs ranged weapons (pistol, shotgun, rifle). What stats differ between them? Damage values, range, accuracy modifiers?

---

## Ammo System

> TBD — Is ammo finite per weapon or shared pool per agent? Reload mechanics? Can ammo be crafted or only looted? Ammunition depletion over time during combat.

---

## Attack Timing (Cooldowns/Windup)

> TBD — How long between attacks? Attack cooldown system? Does melee have different timing than ranged? Windup/recovery frames? Can agents interrupt each other?

---

## Hit Detection

> TBD — How does hit chance work? Accuracy stat? Range modifiers? Line of sight required? Can agents miss? How does accuracy scale with distance and weapon type?

---

## Friendly Fire

> TBD — Is friendly fire on or off? If on, how does it affect squad tactics? Risk/reward of clustering vs spreading out?

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

- What is the exact tick timing for action resolution each frame?
- How do agents queue/interrupt actions mid-combat?
- Should certain weapon types have passive bonuses (shotgun knockback, rifle piercing)?
- Can agents take cover and gain defense bonuses?
- How does agent confusion or panic affect aim/damage during combat?
- Stagger/stun mechanics? Can heavy hits interrupt attacks?
- Does stamina cost apply to attacking? Running and attacking simultaneously?
- How does combat scale when 20+ agents and 50+ zombies are fighting at once?
