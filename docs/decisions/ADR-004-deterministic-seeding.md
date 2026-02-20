# ADR-004: Deterministic Seeding for All RNG

## Status: Accepted
## Date: February 2026

## Context
WSS2 uses procedural generation for maps, entity placement, and AI decisions. Debugging and testing simulations requires reproducibility.

## Decision
All random number generation uses a **seedable PRNG** (pseudo-random number generator). No calls to Math.random() in game logic.

## Details
- Implement Mulberry32 or similar fast seedable PRNG
- Seed is stored in GameConfig and displayed in the UI
- Players can enter a seed manually to replay exact scenarios
- Map generation, entity placement, loot distribution, and AI randomness all use the same PRNG chain
- Known seeds can be stored as "golden tests" — assert that seed X always produces the same map

## Consequences
- Every game run is 100% reproducible given the same seed and config
- Bug reports can include the seed for exact reproduction
- Automated tests can assert map properties for known seeds
- Must be careful: PRNG state is order-dependent (calling order matters)

## Dependencies
- Requires: PRNG implementation (Phase 0)
- Enables: Golden seed tests, regression testing, replay
