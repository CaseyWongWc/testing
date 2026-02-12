# Resources & Economy System

Items, currency, trading mechanics between agents, and the shop system. Includes the Survivor Market rest stops between maps.

---

## Overview

> TBD — What is the flow of resources through the game? How do agents earn currency? When/where do they spend it? How much does the economy affect survival chances?

---

## Resource Types

> TBD — Define all resource categories agents can carry/manage:

- **Health/Healing:** Medical kits, bandages, drugs. Restore health when used.
- **Ammo:** Ammunition per weapon type. Limited supply. Stackable or individual?
- **Items:** General inventory items (grenades, lockpicks, food, water, flares, etc.). Do items take inventory slots?
- **Equipment:** Armor, helmets, backpacks. Equippable gear with stat bonuses.
- **[Other resource types TBD]**

> TBD — Does each agent have inventory limits (carrying capacity)? How many slots? Weight system?

---

## Currency System

> TBD — Economy implementation:

- What is the currency called? Gold? Credits? Scrap?
- How do agents earn currency?
  - Kill bounties (X gold per zombie killed)?
  - Loot caches (fixed loot or percentage drop)?
  - Quest/objective completion?
  - Scavenging actions?
- Is currency shared across the team or per-agent?
- Can currency be transferred between agents?
- Can agents become "wealthy" and have strategic advantages?

---

## Shop System (Sunrise Buy Window)

> TBD — Shop system implementation (IDEA 5 Option C is the favorite):

- **Sunrise Buy Window:** Every dawn, a timed window opens (duration TBD, e.g., 30 seconds game time).
- During the window:
  - Enemies STOP SPAWNING (safe window).
  - All agents can access a shop menu.
  - Limited inventory displayed (rotation or fixed?).
  - Agents spend currency to purchase items.
- Window closes after duration, spawning resumes.
- Does the shop inventory reset each day or carry unsold items?
- Can agents buy on credit or must they pay upfront?

> TBD — Who runs the shop? Is it an abstract vending machine or implied NPC?

---

## Player-to-Player Trading

> TBD — Agent-to-agent trading mechanics (reuse MonsterCards evaluation logic):

- Can agents propose trades (item for item, item for currency)?
- Does evaluation logic from MonsterCards apply (balanced/aggressive/defensive strategies)?
- Are trades instantaneous or require acceptance?
- Can agents refuse unfavorable trades?
- Is there a "market price" reference for items, or do agents negotiate?

---

## Survivor Market (Between-Map Rest Stops)

> TBD — Safe zone implementation (IDEA 5 Updated Solution):

- After finding a portal and exiting current map, agents arrive at the Survivor Market.
- Market is a safe zone (no enemies, no onslaught zone).
- Features available in the Market:
  - **Buy/Sell Items:** Full shop interface, larger inventory than sunrise window.
  - **Trade Between Agents:** More time/options than during gameplay.
  - **Healing:** Restore health for free or cost?
  - **Restock Ammo:** Resupply ammunition.
  - **Repair Equipment:** Fix degraded gear (if durability system exists)?
- Market has flavor NPCs (Neutral Faction D traders) running shops.
- Market duration: Configurable rest period before next map loads (e.g., 60 seconds).

---

## Item List

> TBD — Comprehensive list of all purchasable/lootable items:

- **Weapons:** Pistol, shotgun, rifle, melee weapons (bat, axe, knife), [others TBD]
- **Ammunition:** Pistol rounds, shotgun shells, rifle rounds, [others TBD]
- **Medical:** Med kit, bandages, stimulants, [others TBD]
- **Grenades:** Fragmentation, flashbang, smoke, [others TBD]
- **Utility:** Lockpicks, rope, flares, maps, [others TBD]
- **Armor/Gear:** Helmet, vest, backpack, gloves, [others TBD]
- **Special:** [Rare/unique items TBD]

> TBD — Item stats (damage, durability, weight). Rarity tiers (common, uncommon, rare, legendary)?

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
