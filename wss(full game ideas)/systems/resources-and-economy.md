# Resources & Economy System

Items, currency, trading mechanics between agents, and the shop system. Includes the Survivor Market rest stops between maps.

---

## Overview

v0.1 keeps the economy minimal: HealthPack and Ammo as the only item types, with a simple PickupSystem for collecting items on the ground. Currency (gold) is earned from kills or passive income and is separate from score. The shop system combines Option B (Shop Area) with Option C (Sunrise Buy Window). Between maps, a Survivor Market provides a safe rest stop (Hades-style).

### Game Flow

Map -> Portal -> (Boss chance) -> Survivor Market (safe) -> Next map

---

## v0.1 Items (Minimal)

- **HealthPack** -- Restores health when picked up.
- **Ammo** -- Restocks weapon ammunition (optional in v0.1).

### Item Data Model

Item extends Entity (or can be a simple struct):

- `type`: HealthPack | Ammo
- `position`: (x, y) on the grid
- `effect`: what happens when picked up (heal amount, ammo count)

---

## PickupSystem

The PickupSystem handles item collection:

- When a survivor steps onto a tile containing an Item, the PickupSystem triggers.
- The item's effect is applied to the survivor (restore health, add ammo).
- The item entity is removed from the world.

---

## Currency System

- Currency is **gold** (name can change later).
- Gold is earned from:
  - Kill bounties (X gold per enemy killed)
  - Passive income (TBD)
  - Objective completion (TBD)
- Gold is **separate from score** (score is for win condition, gold is for purchasing).

> TBD -- Is currency shared across the team or per-agent? Can currency be transferred between agents?

---

## Shop System

**Decision:** Option B (Shop Area) + Option C (Sunrise Buy Window)

### Sunrise Buy Window (Option C)

- Every dawn, a timed window opens.
- During the window:
  - **Enemies STOP spawning** (safe period) -- YES, confirmed.
  - All agents can access a shop menu.
  - Agents spend gold to purchase items.
- Window closes after duration, spawning resumes.

### Shop Area (Option B)

- A designated area on the map where agents can access the shop.
- Available during gameplay (not just at sunrise).
- TBD -- exact shop area mechanics.

### If Building System Added Later

- Option A (Craftable Workbench) + Option C (Sunrise Buy Window) would be used instead.
- Survivors can craft a workbench to access shop functionality.

> TBD -- Shop inventory (rotation or fixed?). Can agents buy on credit or must they pay upfront? Who runs the shop?

---

## Player-to-Player Trading

> TBD -- Agent-to-agent trading mechanics (reuse MonsterCards evaluation logic):

- Can agents propose trades (item for item, item for currency)?
- Does evaluation logic from MonsterCards apply (balanced/aggressive/defensive strategies)?
- Are trades instantaneous or require acceptance?
- Can agents refuse unfavorable trades?
- Is there a "market price" reference for items, or do agents negotiate?

---

## Survivor Market (Between-Map Rest Stops)

Hades-style safe zone between maps. After finding a portal and exiting the current map, survivors arrive at the Survivor Market.

- **Safe zone:** No enemies, no onslaught zone.
- **Features:**
  - Buy/Sell Items: Full shop interface, larger inventory than sunrise window.
  - Trade Between Agents: More time/options than during gameplay.
  - Healing: Restore health (free or cost TBD).
  - Restock Ammo: Resupply ammunition.
  - Repair Equipment: Fix degraded gear (if durability system exists, TBD).
- Market has flavor NPCs (Neutral Faction D traders) running shops.
- Market duration: Configurable rest period before next map loads.

---

## Resource Types (Full Roster)

> TBD -- Define all resource categories agents can carry/manage beyond v0.1:

- **Health/Healing:** Medical kits, bandages, drugs. Restore health when used.
- **Ammo:** Ammunition per weapon type. Limited supply. Stackable or individual?
- **Items:** General inventory items (grenades, lockpicks, food, water, flares, etc.). Do items take inventory slots?
- **Equipment:** Armor, helmets, backpacks. Equippable gear with stat bonuses.
- **[Other resource types TBD]**

> TBD -- Does each agent have inventory limits (carrying capacity)? How many slots? Weight system?

---

## Item List (Full Roster)

> TBD -- Comprehensive list of all purchasable/lootable items:

- **Weapons:** Pistol, shotgun, rifle, melee weapons (bat, axe, knife), [others TBD]
- **Ammunition:** Pistol rounds, shotgun shells, rifle rounds, [others TBD]
- **Medical:** Med kit, bandages, stimulants, [others TBD]
- **Grenades:** Fragmentation, flashbang, smoke, [others TBD]
- **Utility:** Lockpicks, rope, flares, maps, [others TBD]
- **Armor/Gear:** Helmet, vest, backpack, gloves, [others TBD]
- **Special:** [Rare/unique items TBD]

> TBD -- Item stats (damage, durability, weight). Rarity tiers (common, uncommon, rare, legendary)?

---

## Connection to Other Systems

- **Combat:** Weapons and ammo tied to combat mechanics (Combat)
- **AI Brains:** Agents use trade evaluation logic when trading (AI Brains)
- **Map Generation:** Loot distribution and shop placement (Map Generation)
- **Spawners & Enemies:** Enemy drops contribute to economy (Spawners & Enemies)
- **Win Conditions:** Resources affect survival and extraction odds (Win Conditions)
- **Day/Night Cycle:** Sunrise buy window triggers at dawn (Day/Night Cycle)

---

## Open Questions

- Should items have weight and encumbrance? How does it affect movement/combat?
- Should items degrade/break? Do they need repair?
- Can agents craft items from materials?
- Should rare items have special properties (unique weapons, legendary armor)?
- Is the shop inventory completely randomized or seeded?
- Should price scaling exist (buy low, sell high, market fluctuation)?
- Can agents store items in a "safe container" between maps?
- Should some items be consumable (one-use) vs permanent (equipment)?
- Can agents sell items back to the shop? For full value or partial refund?
- Should opening containers/looting make noise and attract enemies?
