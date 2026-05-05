# ADR-001: New Engine Architecture with Transplanted Logic

## Status: Accepted
## Date: February 2026

## Context
WSS1 exists as ~20 isolated demo scenes, each a self-contained React component. WSS2 ("A Forgotten Place") needs all systems running simultaneously in a unified game loop. We need to decide: build on top of WSS1, or start fresh.

## Decision
Build a **new game engine from scratch** in `src/wss2/`, but **rewrite proven algorithms** from WSS1 into the new architecture when needed.

## Rationale
- WSS1 scenes weren't designed to compose into a single game loop
- Refactoring monolithic components (WSSTwo.tsx = 2,600+ lines) would cost more than building clean
- Proven algorithms (A*, combat math, terrain costs, spawner logic) are reusable as logic, not as code structure
- WSS1 stays intact as the Assignment 1 deliverable

## Consequences
- All WSS2 code lives in `src/wss2/` — completely separate from WSS1
- Old components in `src/components/`, `src/combat/`, `src/replit/` are read-only reference
- Each algorithm is "transplanted with intent" — understood, then rewritten cleanly
- No shared state between WSS1 and WSS2

## Dependencies
- None — this is the foundational decision
