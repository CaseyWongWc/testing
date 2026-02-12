# Fog of War & Vision System

Shared team vision with remembered fog mechanics. Agents see what teammates see, and explored areas are remembered even when out of sight.

**Locked Decision:** Shared team fog with remembered fog (two-step system: visible vs explored).

---

## Overview

> TBD — How does the two-step fog system work in practice? When an area transitions from visible to remembered, what UI feedback does the player get? How does rendering performance scale with large explored areas?

---

## Shared Team Fog Rules

> TBD — Shared vision mechanics:

- All surviving agents share vision of currently visible tiles (one unified fog per team, not per-agent).
- When any agent sees an enemy, all agents see it.
- When any agent discovers a resource/POI, all agents know about it.
- Vision radius from all agents is combined into a union of visible tiles.

> TBD — Does shared vision reduce the need for communication, or do agents still use help requests? How does this affect AI decision-making simplicity?

---

## Remembered Fog (Explored but Not Currently Visible)

> TBD — Remembered fog mechanics:

- Tiles the team has explored but can't currently see appear in "remembered fog" state.
- Remembered fog shows static terrain (no movement, no updates).
- Enemies in remembered fog don't show their current position (frozen snapshot or hidden entirely?).
- How long does a tile stay "remembered" before it's forgotten?

> TBD — Does remembered fog have a visual distinction (grayed out, translucent, different color)?

---

## Vision Range

> TBD — How far can agents see?

- Base vision range per agent (distance in tiles? Example: 8 tiles in daylight).
- Does vision range vary by agent (scout vs tank?).
- Does vision range vary by terrain (clear plains vs forests?).
- How does elevation change affect vision? (Multi-story buildings)

---

## Day/Night Vision Modifier

> TBD — Vision effects from Day/Night Cycle:

- Daytime: Full/normal vision range (e.g., 8 tiles).
- Nighttime: Reduced vision range (e.g., 4 tiles or 50% reduction).
- Transitional periods (dawn/dusk)? Gradual or instant change?
- Do other conditions affect vision (fog weather, underground)?

---

## Line of Sight & Obstacles

> TBD — What blocks vision?

- Do trees block vision? Partial blocking or full?
- Do buildings/walls block vision through them?
- Do elevated structures give vision advantage (tall towers)?
- Fog/mist tiles? Water? Smoke?
- Can units have "looking around corners" or is it strict line of sight?

> TBD — How is line of sight calculated? Raycast algorithm? Bresenham? Shadow casting?

---

## Connection to Other Systems

- **AI Brains:** Limited local vision affects agent decision-making (AI Brains)
- **Combat:** Vision determines engagement range and hit chance modifiers (Combat)
- **Map Generation:** Terrain and structures affect line of sight blocking (Map Generation)
- **Day/Night Cycle:** Night reduces vision range (Day/Night Cycle)
- **Spawners & Enemies:** Enemy vision may use similar mechanics (Spawners & Enemies)

---

## Open Questions

- Should agents have memory of where they last saw an enemy (estimated position)?
- Can agents track movement patterns (this zombie walked east 2 rounds ago)?
- How long until a tile is completely forgotten? Never, or decaying memory?
- Should some agents have better vision than others (traits/skills)?
- Can vision be enhanced by equipment (binoculars, night vision goggles)?
- Should environmental effects (rain, dust storms) reduce vision range?
- How does vision interact with stealth? Can agents hide from shared vision?
- Should destroying lights/torches reduce vision in nearby areas?
- Can agents "look" in specific directions, focusing vision?
