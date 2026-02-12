# Day/Night Cycle System

A repeating day/night cycle that affects gameplay mechanics, visibility, enemy behavior, and economy. Provides natural rhythm and pacing.

**Reference:** IDEA 4 from WSS -ideas.md

---

## Overview

> TBD -- How long is a full cycle? How many game ticks/rounds comprise day vs night? Is the cycle tied to real-time or game-time? Can cycle timing be configured per difficulty?

---

## Cycle Timing

> TBD -- Duration parameters:

- **Full Cycle:** How many ticks/rounds for complete day -> night -> day loop?
- **Day Duration:** Number of ticks for daylight phase (e.g., 1000 ticks).
- **Night Duration:** Number of ticks for darkness phase (e.g., 800 ticks).
- **Transitional Periods:** Is there a dawn/dusk period with gradual transition or instant flip?
- **Time Display:** Should players see a day/night counter or clock UI element?

---

## Vision Effects

Vision range is modified by time of day through a multiplier applied to the base vision formula.

- **Daytime:** `vision_mult_day = 1.0` (full vision range, e.g., 8 tiles base).
- **Nighttime:** `vision_mult_night = 0.7` (vision reduced to 70% of base).

The multiplier feeds into the fog-and-vision system formula:

```
effective_vision = base_vision * trait_mult * status_mult * timeOfDay_mult
```

### Night Vision Goggles

- **Night vision goggles** can override the night multiplier, effectively giving full daytime vision at night.
- Implementation: when equipped, set `timeOfDay_mult = 1.0` regardless of actual time.

---

## Enemy Behavior Changes

> TBD -- Do enemy types and behaviors shift at night?

- Are enemies more aggressive at night?
- Do only certain enemy types spawn at night (special night-only variants)?
- Do zombie behavior patterns change (roaming speed, aggression, hearing range)?
- Can some enemies see better at night (night-hunters)?
- Does onslaught zone move differently at night?

---

## Sunrise Buy Window

Tied to Resources & Economy system (IDEA 5 Option C):

- **Trigger:** Window opens at dawn (start of day phase).
- **Duration:** Timed window for agents to shop (exact duration TBD).
- **Mechanics:**
  - **Enemies STOP spawning** entirely during window (confirmed safe period).
  - Shop menu accessible to all agents.
  - Agents can purchase items and resources using gold.
  - Trading between agents enabled.
- **Window Close:** After duration expires, spawning resumes and day begins.
- **Frequency:** Happens once per cycle (daily).

---

## Visual Representation

> TBD -- How does time of day appear to the player?

- **Sky Color:** Day = bright, Night = dark. Gradient transition?
- **Lighting:** Dynamic lighting changes? Shadows longer at dusk?
- **Overlay:** Screen tint (blue for night, yellow for day)?
- **UI Clock:** Visual time indicator on HUD (analog clock, digital, progress bar)?
- **Environmental Effects:** Stars at night? Sun position visible in sky?
- **Biome Variation:** Does each biome have unique day/night appearance (snow brighter at night, forests darker)?

---

## Connection to Other Systems

- **Fog & Vision:** Vision range modifiers tied to day/night cycle via `timeOfDay_mult` (Fog & Vision)
- **Spawners & Enemies:** Enemy types and behavior affected by time of day (Spawners & Enemies)
- **Resources & Economy:** Sunrise buy window trigger (Resources & Economy)
- **Combat:** Night might affect hit chance, visibility-based engagement (Combat)
- **AI Brains:** Agents make different decisions based on time (hunt vs scavenge vs hide) (AI Brains)
- **Map Generation:** Biome visuals change with cycle (Map Generation)

---

## Open Questions

- Should cycle timing scale with difficulty (harder = longer nights)?
- Can players manually trigger day/night or is it always automatic?
- Should there be a cycle counter visible to players (day 5, 7, etc.)?
- Do agents have different morale/stamina at different times of day?
- Should some resources only be findable at night or day?
- Can agents sleep/rest during night and recover stamina?
- Does the onslaught zone expand/contract with time of day?
- Should extreme biomes have extreme cycles (polar night/midnight sun in snow biome)?
- Can the buy window be missed if an agent is too far away (travel time)?
- Should boss spawners activate at specific times (night bosses vs day bosses)?
- Do player agents move slower at night even when not in fog?
- Should there be a "too dangerous to move" threshold where agents hunker down?
