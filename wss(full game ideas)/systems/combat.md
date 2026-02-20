# Combat System

Real-time combat engine with 60 ticks per second. Agents and enemies engage in simultaneous real-time action resolution. All humanoid entities (survivors, bandits, raiders, military remnants, scavengers) use the same combat system — enemies are hostile survivors with Brains, not special-cased.

**Locked Decision:** 60 ticks/sec (real-time), reuse RogueLike combat math.

---

## Overview

The combat system runs inside the main tick loop at 60 ticks/sec (configurable between 20-60, recommended 60). Each tick, the `CombatSystem` processes all pending attacks, resolves hits against targets, applies cooldowns, handles noise propagation, and processes death. Combat supports three weapon classes (Fists, Melee, Guns), an armor system, cover mechanics, and simultaneous group attacks.

Per-tick combat flow:
1. Each actor with an Attack intent has their weapon checked for cooldown readiness.
2. If cooldown is zero, the attack resolves: calculate final damage against target.
3. Noise is generated based on the weapon's noise value, alerting enemies within radius.
4. Cooldown resets on the weapon after firing.
5. If target health reaches zero, mark as dead (cleanup phase removes the entity).

---

## Combat Stats (Per Entity)

Every combatant (survivor or hostile humanoid) has 6 core stats:

| Stat | Description |
|------|-------------|
| **Health** | Hit points. Entity dies at 0. |
| **Strength** | Adds bonus damage to melee and fist attacks. |
| **Defense** | Base damage reduction before armor is applied. |
| **Speed** | Movement speed in tiles per tick. Affects kiting and positioning. |
| **Accuracy** | Hit chance modifier for ranged attacks. Scales with distance. |
| **Morale** | Affects willingness to fight or flee. Low morale triggers retreat behavior. |

---

## Faction System

Entities are tagged with a faction for threat assessment:

| Faction | Description |
|---------|-------------|
| **PLAYER_TEAM** | Player-controlled survivors and allies. |
| **HOSTILE** | Bandits, Raiders, Military Remnants, zombies — attack on sight. |
| **NEUTRAL** | Scavengers, traders — won't attack unless provoked. |

Threat assessment uses faction tags to determine engagement priority: HOSTILE entities are always valid targets, NEUTRAL entities are ignored unless they become hostile, and PLAYER_TEAM entities cooperate.

---

## Weapon Data Model

Weapons are defined with the following stats:

- `damage` — base damage per hit
- `range` — effective range in tiles (fists = 1, melee = 1, ranged = variable)
- `cooldown` — ticks between attacks (e.g., 30 ticks = 0.5 seconds at 60 ticks/sec)
- `noise` — noise radius generated on use (alerts enemies within this tile radius)
- `durability` — hits remaining before the weapon breaks (melee only)
- `ammo` — rounds remaining (guns only)
- `utility` — optional secondary function (e.g., crowbar opens doors)

---

## Three Weapon Classes

### 1. Fists

Always available as a desperation fallback. Cannot be dropped or broken.

| Stat | Value |
|------|-------|
| Damage | 5 |
| Range | 1 tile |
| Cooldown | 20 ticks |
| Noise | 0 (silent) |
| Durability | Infinite |

### 2. Melee Weapons

Close-range weapons with a durability system. Each hit decrements durability; at 0 the weapon breaks and is removed from inventory. Some melee weapons have utility functions.

**Subtypes:**

| Subtype | Description |
|---------|-------------|
| **Light** | Fast attacks, low damage, low durability |
| **Medium** | Balanced speed and damage |
| **Heavy** | Slow attacks, high damage, high durability |
| **Improvised** | Jury-rigged, low durability, variable stats |

**Weapon Roster:**

| Weapon | Subtype | Damage | Cooldown | Durability | Noise | Utility |
|--------|---------|--------|----------|------------|-------|---------|
| Knife | Light | 8 | 15 ticks | 40 | 0 | — |
| Baseball Bat | Medium | 12 | 30 ticks | 50 | 0 | — |
| Fire Axe | Heavy | 18 | 45 ticks | 60 | 0 | Chops barricades |
| Machete | Medium | 15 | 25 ticks | 45 | 0 | — |
| Crowbar | Improvised | 10 | 30 ticks | 70 | 0 | Opens locked doors |
| Sledgehammer | Heavy | 25 | 60 ticks | 80 | 0 | Destroys barricades |

All melee weapons have noise = 0 (silent). Range is always 1 tile.

### 3. Guns

Ranged weapons that consume ammo per shot. Guns generate noise on firing, which is the core risk/reward tradeoff: high damage output at range, but alerts enemies within the noise radius.

**Categories:**

| Weapon | Category | Damage | Range | Cooldown | Noise | Ammo Type |
|--------|----------|--------|-------|----------|-------|-----------|
| 9mm Pistol | Pistol | 15 | 5 tiles | 30 ticks | 4 | 9mm |
| Shotgun | Shotgun | 30 | 3 tiles | 50 ticks | 6 | 12 gauge |
| Assault Rifle | Rifle | 20 | 8 tiles | 20 ticks | 8 | 5.56mm |
| Crossbow | Silent Ranged | 18 | 6 tiles | 60 ticks | 1 | Bolts |
| Compound Bow | Silent Ranged | 14 | 5 tiles | 45 ticks | 1 | Arrows |

**Silenced Variants:** Rare loot versions of pistols and rifles with significantly reduced noise values. A silenced pistol might have noise 1 instead of 4.

**Ammo:** Ammo is finite and tracked per type. Ammo is looted from the world or traded. When a gun runs out of ammo, the entity falls back to melee or fists. Reload is instant in v0.1 (reload mechanics are a stretch goal).

---

## Noise Mechanic

Firing a gun creates noise in a tile radius equal to the weapon's `noise` value. All enemies within that radius are alerted and begin moving toward the noise source.

**Rules:**
- Noise is generated at the moment of firing, centered on the shooter's position.
- Enemies within the noise radius that are not already engaged will path toward the noise source.
- Multiple shots stack awareness but not radius — the radius is per-shot, not cumulative.
- Silent weapons (fists, all melee, crossbow, compound bow) do not generate meaningful noise.
- Noise decays after one evaluation cycle; it is not persistent.

**Risk/Reward:** Guns deal high damage and have range advantage, but every shot risks pulling in additional threats. Players must weigh whether the kill is worth the incoming wave. This creates strategic depth: use silent weapons to stay hidden, or go loud and deal with the consequences.

---

## Armor System

Armor provides damage reduction and has its own durability that degrades with each hit received.

**Tiers:**

| Tier | Example | Protection | Speed Penalty | Durability |
|------|---------|------------|---------------|------------|
| None | — | 0 | None | — |
| Light | Leather Jacket | 3 | None | 30 hits |
| Medium | Tactical Vest | 6 | Minor (-5% speed) | 50 hits |
| Heavy | Riot Gear | 10 | Significant (-15% speed) | 80 hits |

Each hit taken decrements armor durability by 1. When durability reaches 0, the armor breaks and protection drops to 0. Armor can be repaired with specific crafting materials (stretch goal).

---

## Damage & Defense Formula

```
Final Damage = (Weapon Base Damage + Strength Modifier) - (Defense + Armor Protection)
```

Minimum 1 damage always applies. No attack deals zero damage.

**Example:** A survivor with Strength 3 swings a Baseball Bat (12 dmg) at a bandit with Defense 2 wearing a Tactical Vest (6 protection):

```
Final Damage = (12 + 3) - (2 + 6) = 15 - 8 = 7
```

**Example:** Fists (5 dmg) with Strength 1 against Riot Gear (10 protection) + Defense 3:

```
Final Damage = (5 + 1) - (3 + 10) = 6 - 13 = -7 → clamped to 1
```

---

## Group Combat (Simultaneous Attacks)

When multiple enemies surround a survivor, ALL attackers resolve their attacks in the same tick. Attacks are not queued or serialized — they happen simultaneously.

**Example:** 3 basic zombies (8 damage each) surround a survivor:

```
Total damage in one tick = 8 + 8 + 8 = 24 damage
```

This makes being surrounded extremely deadly and encourages:
- **Kiting:** Keep moving to prevent encirclement.
- **Ranged play:** Engage before enemies close to melee range.
- **Chokepoints:** Use terrain to limit the number of simultaneous attackers.
- **Cover:** Position behind obstacles to reduce incoming ranged damage.

---

## Cover System

Cover reduces incoming ranged damage based on the cover level between the defender and the attacker.

| Cover Type | Example | Ranged Damage Reduction |
|------------|---------|------------------------|
| Half Cover | Crate, bush, low wall | 25% |
| Full Cover | Wall, vehicle, barricade | 50% |

**Implementation:**
- Cover is a tile property: `Tile.coverValue` (0, 0.25, or 0.5) and `Tile.coverDirection` (N/S/E/W).
- Cover is directional: the defender must be behind the cover relative to the attacker's position.
- Melee attacks ignore cover entirely — cover only affects ranged damage.
- Cover reduction is applied after the damage formula resolves.

**Scope:**
- v0.1: Player-controlled survivors can use cover. AI entities do not seek cover.
- v0.2+: AI seeks cover as a stretch goal (Brain-driven positioning).

---

## Combat Consumables

### Healing Items

| Item | Effect |
|------|--------|
| Bandage | Small heal (restores 15 HP) |
| Medkit | Large heal (restores 50 HP) |
| Painkiller | Temporary damage reduction (reduce incoming damage by 3 for 300 ticks) |
| Adrenaline | Temporary speed boost (+25% speed for 300 ticks) |

### Throwables

| Item | Effect |
|------|--------|
| Molotov | Area fire damage (10 damage/tick for 120 ticks in a 2-tile radius) |
| Smoke Grenade | Blocks vision in a 3-tile radius for 180 ticks |
| Flashbang | Stuns all entities in a 2-tile radius for 60 ticks (no actions) |
| Noise Maker | Distraction device — generates noise at the landing tile, attracting enemies away from the thrower |

### Utility Items

| Item | Effect |
|------|--------|
| Barricade Kit | Places a barricade on an adjacent tile, blocking pathing |
| Trap | Places a trap on a tile, deals 20 damage to the first enemy that steps on it |
| Flare | Reveals a 5-tile radius through fog of war for 300 ticks |

---

## Humanoid Combat (Unified System)

All humanoid entities use the same combat system. There is no separate logic for enemies vs. survivors.

**Entity types using the combat system:**
- Player-controlled Survivors
- Bandits (HOSTILE)
- Raiders (HOSTILE)
- Military Remnants (HOSTILE)
- Scavengers (NEUTRAL, become HOSTILE if provoked)

Each humanoid has the same 6 stats, can equip weapons and armor, use consumables, and is driven by a Brain for AI decision-making. The only difference between a player survivor and a bandit is their faction tag and Brain configuration.

Zombies use a simplified version: they have Health, Damage, and Speed but no weapon/armor slots. Zombie attacks are treated as built-in melee (range 1, noise 0).

---

## Brain-Driven Weapon Selection

AI entities select weapons based on range to target and available inventory. The Brain evaluates:

1. **Range check:** Is the target within melee range (1 tile) or ranged range?
2. **Weapon availability:** Does the entity have ammo for ranged weapons?
3. **Fallback chain:** Gun → Melee → Fists

**Brain Type Overrides:**

| Brain Type | Weapon Behavior |
|------------|----------------|
| **Cautious** | Conserves ammo, prefers melee unless outnumbered, retreats at low health |
| **Aggressive** | Goes all-in, empties clips, charges into melee range |
| **Survivalist** | Hoards resources, uses the minimum force necessary, avoids unnecessary fights |
| **Money-driven** | Won't waste expensive ammo on low-value targets, calculates cost/benefit |

---

## Full Encounter Flow

A complete combat encounter follows this sequence:

1. **Detection:** Entity enters another entity's vision range (affected by Fog of War and Day/Night).
2. **Threat Assessment:** Brain evaluates the detected entity's faction tag. HOSTILE triggers engagement, NEUTRAL is monitored, PLAYER_TEAM is allied.
3. **Engagement:** Entity selects a weapon based on range and Brain type, begins moving into attack range if necessary.
4. **Attack Resolution:** Weapon cooldown reaches zero, damage formula resolves, noise propagates, armor durability decrements.
5. **Retaliation:** Target (if alive and hostile) performs its own attack resolution in the same tick or next available tick.
6. **Outcome:** Combat continues until one side is dead, flees (morale break), or disengages (out of vision range).

---

## CombatSystem

The `CombatSystem` is responsible for:
- Resolving hit attempts (attacker vs target based on range, accuracy, and weapon)
- Applying the damage formula including armor and cover modifiers
- Managing weapon cooldowns (decrement each tick, allow attack when zero)
- Processing simultaneous group attacks in the same tick
- Generating noise events from gun usage
- Decrementing weapon durability and ammo counts
- Processing death (mark entity as dead when health <= 0)
- Integrating with the cleanup phase to remove dead entities and trigger loot drops

---

## Attack Timing (Cooldowns)

Attacks use a cooldown system measured in ticks. After an attack resolves, the weapon enters cooldown for N ticks before it can fire again.

- Fists cooldown: 20 ticks
- Light melee cooldown: 15-25 ticks
- Medium melee cooldown: 25-30 ticks
- Heavy melee cooldown: 45-60 ticks
- Pistol cooldown: 30 ticks
- Rifle cooldown: 20 ticks
- Shotgun cooldown: 50 ticks
- Silent ranged cooldown: 45-60 ticks

Windup/recovery frames are a stretch goal for v0.2+.

---

## Distance & Range Model

**Locked Decision:** Float Euclidean distance for all combat checks.

- All distance checks (weapon range, melee reach, noise radius) use **float Euclidean distance** between entity positions, NOT tile distance.
- This prevents "sub-tile but feels grid-snappy" combat.
- Melee range: ~0.8–1.2 tiles (float distance).
- Cover evaluation still uses tile-based coverValue/coverDirection but attacker/defender positions are float.

---

## Hit Detection

Hit chance is determined by the attacker's Accuracy stat modified by distance and weapon type:

- Melee attacks within range 1 always hit (100% accuracy).
- Ranged attacks use: `Hit Chance = Base Accuracy - (Distance * Range Penalty)`
- Line of sight is required for ranged attacks. Blocked LoS prevents the attack.
- Night time reduces effective vision range, which indirectly limits ranged engagement distance (see Day/Night Cycle).

---

## Friendly Fire

Friendly fire is ON. Attacks that hit an allied entity (same faction) deal full damage. This creates tactical considerations:
- Avoid clustering allies in the line of fire.
- Throwables (Molotov, Flashbang) affect all entities in the area, including allies.
- Brain-driven AI avoids shooting through allies when possible, but panic/low morale may override this.

---

## Connection to Other Systems

- **Weapons & Equipment:** Tied to Resources & Economy (items, drops, trading)
- **Agent Stats:** Health, Strength, Defense, Speed, Accuracy, Morale from AI Brains
- **Fog of War:** Vision Range affects detection and ranged engagement (Fog & Vision)
- **Win Conditions:** Kill score contributes to Extraction probability (Win Conditions)
- **Day/Night Cycle:** Night reduces vision range, limiting ranged combat effectiveness (Day/Night Cycle)
- **Spawners & Enemies:** Zombie/enemy types use the same combat math (Spawners & Enemies)
- **Noise → Spawners:** Gun noise can trigger nearby dormant spawners or attract roaming enemies
- **AI Brains:** Brain type drives weapon selection, engagement range, retreat thresholds, and resource management

---

## Open Questions

### Resolved
- ~~Damage formula~~ → Defined: `(Weapon Base Damage + Strength) - (Defense + Armor)`, minimum 1.
- ~~Full weapon list~~ → Three weapon classes with specific stats defined above.
- ~~Ammo system~~ → Ammo is finite, tracked per type, looted from world.
- ~~Cover system~~ → Half cover (25%) and full cover (50%), directional, tile-based.
- ~~Hit detection~~ → Melee always hits, ranged uses Accuracy - Distance penalty, LoS required.
- ~~Friendly fire~~ → ON, full damage to allies.

### Still Open
- How do agents queue/interrupt actions mid-combat?
- Should certain weapon types have passive bonuses (shotgun knockback, rifle piercing)?
- Stagger/stun mechanics from heavy hits — how long, what thresholds?
- Does stamina cost apply to attacking? Running and attacking simultaneously?
- How does combat scale when 20+ agents and 50+ zombies are fighting at once? (Performance budget)
- Reload mechanics for guns (v0.2+ stretch goal).
- Armor repair/crafting system details.
- AI cover-seeking behavior implementation details (v0.2+ stretch goal).
