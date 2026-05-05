# ADR-005: Fixed Timestep Game Loop

## Status: Accepted
## Date: February 2026

## Context
WSS2 runs real-time at 60 ticks/sec. Need a game loop that decouples simulation updates from rendering frame rate.

## Decision
Use a **fixed timestep** game loop pattern with requestAnimationFrame.

## Details
- Target: 60 simulation ticks per second
- Each tick is a fixed time step (1/60th of a second at 1x speed)
- requestAnimationFrame drives the render loop
- Delta time accumulates; when enough time has passed, run one or more update ticks
- Rendering happens once per frame regardless of tick count
- Game speed multiplier scales the accumulation rate (2x speed = ticks accumulate twice as fast)

## Per-Tick Update Order
1. **Sense** — entities gather local info (Phase 1+)
2. **Decide** — brains produce intents (Phase 1+)
3. **Act** — intents resolved, movement/combat applied (Phase 1+)
4. **Spawn** — spawners check cooldowns (Phase 1+)
5. **Cleanup** — remove dead entities, update fog (Phase 1+)

Phase 0: update just increments tick counter. The per-tick phases are implemented in Phase 1.

## Consequences
- Simulation is deterministic regardless of frame rate
- Slow machines still simulate correctly (just fewer frames rendered)
- Speed slider is trivial to implement (just change accumulation rate)
- Pause = stop accumulating delta time

## Dependencies
- Requires: Game class (Phase 0)
- Enables: All simulation systems (Phase 1+)
