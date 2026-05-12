# Release Notes — WSS2 *A Forgotten Place*

**Document type:** Release Notes (PM deliverable)

This document chronicles the visible changes shipped over the course of the CS 4800 Spring 2026 semester. Releases are grouped by sprint, in chronological order, ending with the final Phase 3 release that ships with this submission.

---

## v0.1.0 — "Storyboard" — Sprint 1 (February 2026)

**Theme:** Prove the concept. Front-end-only interactive prototype.

**New**
- Interactive storyboard prototype demonstrating screen-by-screen navigation across the planned use cases.
- Initial business plan slides: vision, problem statement, target audience.
- First wireframes for the Observer-mode UI.

**Notes**
- No simulation, no AI, no persistence yet — purely a click-through.
- Submitted as Assignment 1 deliverable.

---

## v0.2.0 — "Vertical Slice" — Sprint 2 Phase 1 (March 2026)

**Theme:** A real game tick. AI moves, zombies exist, but they're dumb.

**New**
- Procedurally generated grid map (30×30 default).
- Single-survivor spawn at map center.
- Basic zombie spawn from corruption nests.
- A* pathfinding with smooth float-position interpolation.
- HTML5 canvas renderer with HUD (HP, round counter).
- Real-time tick loop at 60 Hz.

**Known issues**
- "Instant swarm" problem — every zombie immediately knew the survivor's position.
- No vision system; no fog of war.

---

## v0.3.0 — "Phase 2" — Sprint 2 Demo (April 8, 2026)

**Theme:** Make the AI feel like an *AI*, not a homing missile.

**New**
- **Zombie vision/aggro range** — zombies now have an 8–10 tile detection radius. They only chase survivors they can see, fixing the "instant swarm" problem.
- **Nest spawn cap** — corruption nests are limited to 3–4 simultaneous active zombies, so the map can't be flooded.
- **Survivor "lose-interest" behavior** — survivors disengage from threats they can no longer see, returning to wander.
- **Multi-survivor support** — up to 5 AI survivors per run.
- **Five personality types** for survivors: Balanced, Aggressive, Cautious, Survivalist, Money-Driven.
- **Compass HUD widget** pointing to the active objective.
- **Six objective types:** ActivateSwitch, Survive, Extract/ReachPortal, DestroyNests, Collect, Rescue.
- **Run grading** — S/A/B/C/D/F based on objectives, evac %, time, loot.

**Engineering**
- Hybrid tick-based + event-driven AI architecture (default every-tick, fallback every 5 ticks).
- Faction system: PLAYER_TEAM / HOSTILE / NEUTRAL.

**Demo seed:** `12345` on a 40×40 map yielded a clean MISSION COMPLETE for the live demo.

---

## v0.4.0 — "ICE-8 / Spec-Driven" — April 29, 2026

**Theme:** Engineering rigor.

**New**
- Test Case Specification (8 test cases, IEEE-829-style) covering meta-progression, run loop, scoring, persistence, and navigation.
- Full traceability matrix linking each use case to ≥1 test case.
- In-code self-test on `computeNightBonus` — throws at module load if the implementation drifts from the documented formula.

**Notes**
- This release is documentation-heavy; no new gameplay, but every shipping formula now has a test.

---

## v0.5.0 — "Phase 3 — Variants & Day/Night" — Early May 2026

**Theme:** A world that breathes. Daytime is forgiving; nighttime kills.

**New — Zombie variants**
- **Walker** — slow, low alert radius. The default zombie.
- **Runner** — fast, high alert radius. Punishes survivors who get caught in the open.
- **Brute** — high HP, slow, large body. Tank.
- Tier-weighted spawn buckets so map difficulty can scale.

**New — Day / Night cycle**
- Fixed-tick cycle: `DAY_LENGTH = 600` ticks, `NIGHT_LENGTH = 400` ticks.
- Zombies are up to **1.6×** more alert at night (line-of-sight + hearing).
- Survivors carry a light radius that punches through the night overlay.
- Visible night overlay tinting on the canvas.

**New — Meta progression**
- **Scrap** currency, persisted to `localStorage`.
- **Survivor Market** between runs: gear (Pistol, Shotgun, Medkit, Extra Survivor) and 5 perks (Iron Will, Scrap Magnet, Quick Hands, Sharp Senses, Starter Cache).
- **Perk caps** so progression is bounded.
- **Run-end breakdown panel** showing kills (day vs night), evacuations, scrap awarded, perks active.

**New — Night-bonus economy**
- Formula: `round((nightKills × 2 + nightEvacuations × 5) × scrapMultiplier)`.
- Live HUD pill shows accumulating bonus during the night phase.
- Documented and self-tested (see v0.4.0).

**New — Presentation layer**
- 13-slide deck artifact `wss2-deck` with dark indigo brand identity.
- Real in-game screenshot embedded in slide 4.

---

## v0.5.1 — "Submission" — May 15, 2026 *(this release)*

**Theme:** Ship the documentation package.

**New**
- Complete CS 4800 deliverable bundle: Project Charter, Functional/Requirements Spec, Technical/Design Spec, Test Case Spec, Source Code pointer, Build & Deployment Instructions, Release Notes.
- Activity, sequence, class hierarchy, and context/deployment diagrams for the implemented system (Mermaid format, GitHub-renderable).

**No gameplay changes.**

---

## Roadmap (post-class — not in this submission)

| Tag | Theme |
|---|---|
| v0.6 | Spotted-indicator HUD + post-mortem timeline panel |
| v0.7 | Run-history persistence (localStorage → IndexedDB → Postgres backend) |
| v0.8 | LLM-driven "god system" for high-level survivor strategy |
| v0.9 | Multiplayer observer mode (shared spectating) |
| v1.0 | Public release, mobile-friendly layout, audio pass |
