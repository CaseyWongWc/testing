# Resources & Economy System

Items, currency, trading mechanics between agents, and the shop system. Includes the Survivor Market rest stops between maps.

---

## Overview

The economy system covers items, currency, trading, and the Survivor Market. Items include weapons, armor, consumables (healing, throwables, utility), and ammo. Currency (gold) is earned from kills, scavenging, and objective completion. Between maps, the Survivor Market provides a safe rest stop (Hades-style) where survivors buy, sell, heal, and restock.

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

## Loot Distribution (LOCKED)

Loot enters the game through two channels:

### Pre-Placed Loot (Map Generation)
- **Building-clustered:** Primary loot source. Items spawn in loot sockets inside building stamps and scattered on building floors.
- **Random outdoor scatter:** Secondary source. Items appear randomly in open terrain, controlled by a pre-game density slider per terrain type.
- **Themed containers:** Building type determines loot category — hospitals yield medical supplies, military buildings yield weapons/ammo, etc. (see Map Generation for full mapping).
- **Density:** More loot indoors than outdoors. Container loot inside buildings + scattered floor items; sparser ground items outside.

### Enemy Drops
- Human enemies drop their equipped gear on death: weapons, ammo, armor, food/water, currency, clothes, backpacks.
- **Backpack limit:** Each survivor can carry only 1 backpack.
- Tougher human enemies (higher difficulty maps) carry and drop better gear.
- Zombie enemies may drop minor items but are not a primary loot source.

### Loot Quality
- **No rarity tier labels** — no common/rare/legendary system.
- **Difficulty-driven quality (C+A hybrid):** Map difficulty does the heavy lifting for loot quality. A mild distance-from-spawn nudge adds spatial flavor (removable for other game modes).

### Loot Respawn
- Loot respawn is **ON by default** (togglable in pre-game settings).
- Container loot is **one-time only** — once looted, stays empty.
- Respawned loot appears as new ground items or in newly generated containers, not in previously looted ones.

---

## Currency System

- Currency is **gold** (name can change later).
- Gold is earned from:
  - Kill bounties (X gold per enemy killed)
  - Scavenging (looting containers, searching structures)
  - Objective completion (bonus gold for completing map objectives)
- Gold is **separate from score** (score is for win condition, gold is for purchasing).

> TBD -- Is currency shared across the team or per-agent? Can currency be transferred between agents?

---

## Trader Types

Three distinct trader archetypes appear in-game:

### Wandering Merchant

- Roams the map during gameplay.
- Limited inventory, random stock.
- Disappears after a set number of ticks or when inventory is sold out.
- Prices are fair (1.0x base multiplier).

### Settlement Trader

- Fixed location on the map, typically inside or near structures.
- Larger inventory than wandering merchants.
- Restocks inventory at dawn (sunrise restock cycle).
- Prices slightly above base (1.1x–1.2x multiplier).

### Black Market

- Rare spawn, hidden in hard-to-reach locations.
- Sells powerful/rare items not available from other traders.
- High prices (1.5x–2.0x multiplier).
- Does not restock — once sold out, gone for the map.

### TradeOffer Structure

Each item a trader sells is represented as a TradeOffer:

- `itemID` -- reference to the item being sold
- `price` -- gold cost to purchase
- `quantity` -- number available in stock (decrements on purchase)

### Pricing Modifiers

Base prices are modified by:

- **Difficulty multiplier** -- higher difficulty increases prices (Easy: 0.8x, Normal: 1.0x, Hard: 1.3x)
- **Scarcity multiplier** -- items with low remaining stock across the map cost more (1.0x–1.5x)
- **Combined formula:** `final_price = base_price * difficulty_mult * scarcity_mult`

### Restock Mechanics

- Settlement Traders restock at each dawn cycle (partial restock, not full reset).
- Wandering Merchants do not restock — they carry what they carry.
- Black Market does not restock.
- Survivor Market (between maps) fully restocks each visit.

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

- **Safe zone:** No enemies, no onslaught zone, no timer pressure.
- **Features:**
  - **Buy/Sell Items:** Full shop interface, larger inventory than sunrise window. Survivors can sell unwanted gear for gold.
  - **Heal:** Restore health (free partial heal, full heal costs gold — TBD).
  - **Restock Ammo:** Resupply ammunition at market prices.
  - **Trade Between Agents:** More time/options than during gameplay.
  - **Repair Equipment:** Fix degraded gear (if durability system exists, TBD).
- Market has flavor NPCs (Neutral Faction D traders) running shops.
- Market duration: Configurable rest period before next map loads.
- Market inventory fully restocks each visit.

---

## Ammo System

Ammunition is tracked **per weapon type**, not as a shared pool.

- **PistolRounds** -- used by pistols and revolvers
- **ShotgunShells** -- used by shotguns
- **RifleRounds** -- used by rifles and assault rifles
- **SpecialAmmo** -- used by unique/rare weapons (crossbow bolts, explosive rounds, etc.)

Each survivor carries their own ammo counts per type. Picking up an Ammo item adds to the matching ammo type. Weapons without matching ammo cannot fire (switch to melee or flee).

---

## Stamina System

Stamina is a fast-recharging resource that gates burst actions.

- **Recharge rate:** Recovers quickly during idle or normal movement.
- **Drain triggers:** Sprinting, dodging, heavy melee attacks, and special abilities consume stamina.
- **Hunger/Thirst interaction:** Low hunger or thirst slows stamina recharge rate. Well-fed survivors recover stamina faster.
- **Zero stamina:** Survivor cannot sprint or perform stamina-costing actions until partial recovery.

---

## Charms & Lucky Items

Passive bonus items that provide persistent effects. Three scopes:

### Personal Charms

- Affect a single survivor only.
- Examples: Lucky Coin (+5% accuracy), Rabbit's Foot (+10% loot find), Tough Hide (+1 defense).
- Equipped in a charm slot, one per survivor.

### Team Charms

- Affect all living survivors on the team.
- Examples: War Banner (+5% damage for all), Medic's Oath (+10% healing received for all), Scout's Map (reveal a small area of the map).
- One team charm active at a time.

### World Charms

- Affect the map or difficulty parameters globally.
- Examples: Cursed Idol (more enemies but better loot), Peaceful Totem (fewer enemy spawns), Storm Caller (reduced vision but enemies also have reduced vision).
- Applied at the start of a map, cannot be changed mid-run.

---

## Resource Types (Full Roster)

> TBD -- Define all resource categories agents can carry/manage beyond v0.1:

- **Health/Healing:** Medical kits, bandages, drugs. Restore health when used.
- **Ammo:** Ammunition per weapon type. Limited supply. Stackable.
- **Items:** General inventory items (grenades, lockpicks, food, water, flares, etc.). Do items take inventory slots?
- **Equipment:** Armor, helmets, backpacks. Equippable gear with stat bonuses.
- **Consumables:** Bandages, Medkits, Molotovs, Stims, Rations — single-use items with immediate effects.
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
- **Charms:** Personal, Team, and World charms [specific items TBD]
- **Special:** [Rare/unique items TBD]

> TBD -- Item stats (damage, durability, weight). No rarity tiers (LOCKED — quality driven by difficulty, not labels).

---

## Connection to Other Systems

- **Combat:** Weapons and ammo tied to combat mechanics (Combat)
- **AI Brains:** Agents use trade evaluation logic when trading (AI Brains)
- **Map Generation:** Loot distribution and shop placement (Map Generation)
- **Spawners & Enemies:** Enemy drops contribute to economy (Spawners & Enemies)
- **Win Conditions:** Resources affect survival and extraction odds (Win Conditions)
- **Day/Night Cycle:** Sunrise buy window triggers at dawn (Day/Night Cycle)
- **Object Model:** Ammo types match weapon ammoType field, stamina tied to Actor stats (Object Model)

---

## Open Questions

- Should items have weight and encumbrance? How does it affect movement/combat?
- Can agents craft items from materials?
- Should rare items have special properties (unique weapons, legendary armor)?
- Is the shop inventory completely randomized or seeded?
- Should price scaling exist (buy low, sell high, market fluctuation)?
- Can agents store items in a "safe container" between maps?
- Should some items be consumable (one-use) vs permanent (equipment)?
- Can agents sell items back to the shop? For full value or partial refund?
- Should opening containers/looting make noise and attract enemies?
