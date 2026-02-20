# ADR-003: HTML5 Canvas Rendering

## Status: Accepted
## Date: February 2026

## Context
WSS1 uses DOM-based rendering (React elements for each tile). WSS2 needs to render 30x30 to 60x60 grids with multiple entities at 60 FPS.

## Decision
Use a single **HTML5 Canvas** element for all game rendering. React only manages the UI shell (menus, HUD overlay, settings).

## Rationale
- Canvas is far more performant than DOM for grid rendering at scale
- Viewport culling is straightforward (only draw visible tiles)
- Supports smooth entity movement at float positions natively
- Future sprite rendering maps directly to Canvas drawImage
- React state updates don't trigger game redraws (decoupled)

## Consequences
- Game state lives in plain TypeScript objects, not React state
- React component is a thin wrapper that mounts the canvas and provides UI controls
- Camera/viewport math needed to convert world coords to screen pixels
- Click/input handling goes through the canvas, not React event handlers

## Dependencies
- Requires: Camera system (Phase 0)
- Enables: Sprite rendering (Phase 2+), efficient fog-of-war rendering (Phase 1)
