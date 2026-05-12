# Project Charter — WSS2 *A Forgotten Place*

**Document type:** Project Charter (PM deliverable)
**Course:** CS 4800.03 — Software Engineering, Spring 2026
**Project Sponsor:** Course instructor / self-sponsored academic project
**Project Manager:** Casey Wong
**Charter date:** February 2026 (revised May 2026 for final submission)

---

## 1. Project Vision

Build a **zero-player survival-horror AI simulation** in which the human is a meta-strategist, not a pilot. AI-controlled survivors fight zombies, scavenge, and attempt to evacuate on their own; the player only influences outcomes by choosing perks and gear between runs from a meta shop.

The product, *A Forgotten Place* (codename WSS2), exists to demonstrate full software-engineering lifecycle competence: requirements engineering, OO design, layered architecture, autonomous AI behavior, and test-case specification — packaged inside a playable, presentable artifact.

## 2. Problem Statement

Most "AI in games" coursework reduces to scripted finite-state machines or pre-recorded behavior trees. A zero-player frame forces the AI to actually *decide* — without a human safety net to paper over weak heuristics. This makes the AI's reasoning observable, gradable, and a useful pedagogical artifact for a software-engineering course that wants to exercise design-by-contract and traceable requirements.

## 3. Project Objectives & Success Criteria

| # | Objective | Success Metric |
|---|---|---|
| O1 | Ship a playable simulation of a single self-contained run | A user can open the live URL, start a run, and watch a complete day → night → run-end cycle without crashing |
| O2 | Demonstrate non-trivial autonomous AI | Survivors detect, chase, and lose interest in zombies through a layered Sense → Decide → Act loop with a documented priority list |
| O3 | Demonstrate spec-driven engineering | Source contains in-code self-tests for critical formulas (e.g. `computeNightBonus`); requirements traceable to use cases and test cases |
| O4 | Ship a meta-progression layer | Currency (Scrap), Survivor Market, and at least 5 perks; persisted across runs in localStorage |
| O5 | Deliver full SE documentation package | All 7 deliverables in this submission folder graded ≥ 16/20 |

## 4. Scope

### In Scope (delivered for this submission)
- Procedural map generation (grid-based, configurable size)
- Survivor AI: layered behavior (wander → see-and-chase → lose-interest), 6-state priority list
- Zombie variants: Walker / Runner / Brute, tier-weighted spawning
- Day / Night cycle (DAY_LENGTH=600 ticks, NIGHT_LENGTH=400 ticks) with night-aware AI
- Combat system (melee + ranged with reload + ammo)
- Meta shop with Scrap currency, gear (Pistol, Shotgun, Medkit, Extra Survivor) and 5 perks
- Run-end scoring with night-bonus formula and S/A/B/C/D/F grading
- Slide deck artifact for presentation

### Out of Scope (deferred to post-class roadmap)
- LLM-driven "god system" for high-level survivor strategy (Phase 8+)
- Multiplayer / online leaderboards
- Mobile-native build (web-only for this submission)
- Audio / music

## 5. Stakeholders

| Stakeholder | Interest | Influence |
|---|---|---|
| Course instructor | Grades the deliverable bundle and the live demo | High |
| Casey Wong (developer) | Sole developer, responsible for shipping & documenting | High |
| Class peers | Audience for live presentation; provide informal feedback | Low |

## 6. Milestones (actuals)

| Milestone | Target | Status |
|---|---|---|
| Sprint 1 — Business plan + storyboard prototype | Wed Feb 25, 2026 | ✅ Done |
| Assignment 1 — Interactive storyboard | Wed Mar 4, 2026 | ✅ Done |
| Sprint 2 demo — Phase 2 zombie vision / nest cap / aggro | Wed Apr 8, 2026 | ✅ Done |
| ICE-8 — Test Case Spec + Traceability Matrix | Wed Apr 29, 2026 | ✅ Done |
| Phase 3 ship — variants, day/night, meta shop, 5 perks | Early May 2026 | ✅ Done |
| Live presentation (Phase 3) | May 12, 2026 | ✅ Presenting |
| Final documentation submission | Fri May 15, 2026 11:59pm | 🟡 In submission |

## 7. Constraints & Assumptions

- **Tech stack constrained to web** — no native binaries; final artifact must run in a modern browser via the Replit-hosted URL.
- **Solo team** — one developer covers PM, BA, DEV, and QA roles.
- **AI tooling permitted** — per course policy, ChatGPT / Claude / Replit Agent were used for diagram generation and documentation drafting; all design and architecture decisions are the student's.
- **Open-source license assumed** — no proprietary or commercial constraints on the codebase.

## 8. Risks (and what we did about them)

| Risk | Mitigation taken |
|---|---|
| Scope creep into Phase 8+ LLM systems would push past deadline | Hard cut: LLM god system deferred to post-class roadmap; submission ships Phase 3 |
| Zero-player AI feels "broken" to audience because no human input | Added live HUD, run-end breakdown, and screenshot-in-deck so observers can read the AI's decisions |
| Solo developer / single point of failure | All artifacts version-controlled in Git; Notion mirror of all design docs |
| Late-breaking AI bug masking real progress | In-code self-tests on critical formulas (`computeNightBonus`) catch regressions at startup |

## 9. Approval

This charter is self-approved by the project owner for academic submission. No external sign-off required.

---

*Casey Wong — May 2026*
