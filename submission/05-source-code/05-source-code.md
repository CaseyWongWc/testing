# Source Code

**Document type:** Source Code Pointer (DEV deliverable)

The full source code is available at:

- **GitHub repository:** https://github.com/CaseyWongWc/testing
- **Branch:** `wss2`
- **Live deployment:** https://wss-revised.replit.app/
- **Replit workspace:** the same monorepo this `submission/` folder lives inside

---

## Repository Layout (high-level)

```
testing/                                    pnpm monorepo root
├── artifacts/
│   ├── a-forgotten-place/                  ← THE GAME (grade this)
│   │   ├── src/
│   │   │   ├── combat/
│   │   │   │   ├── WSSPhase3.tsx          ← main simulation, AI, day/night, formulas
│   │   │   │   ├── WSS2MetaShell.tsx      ← meta shop, perks, persistence
│   │   │   │   ├── Combat.tsx              ← top-level picker / project name
│   │   │   │   ├── ZombieAISandbox.tsx    ← AI tuning sandbox
│   │   │   │   └── WSSPhase0/1/2.tsx      ← incremental phase prototypes
│   │   │   └── ...
│   │   ├── package.json
│   │   └── replit.md                       ← per-artifact feature list
│   ├── wss2-deck/                          ← presentation slide deck
│   │   └── src/pages/slides/*.tsx          ← 13 slides
│   ├── api-server/                         ← Express API stub (reserved)
│   └── mockup-sandbox/                     ← internal component preview tool
├── lib/                                    shared composite TypeScript libraries
│   ├── api-spec/                           OpenAPI source + Orval-generated hooks
│   └── db/                                 Drizzle schema (reserved)
├── submission/                             ← THIS FOLDER (CS 4800 deliverables)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── replit.md                               root project overview
```

## Most Important Files for Grading

| File | What it contains | Lines |
|---|---|---|
| `artifacts/a-forgotten-place/src/combat/WSSPhase3.tsx` | Main simulation: tick loop, day/night cycle, survivor AI brain, perk constants, night-bonus formula with self-test | ~2,000+ |
| `artifacts/a-forgotten-place/src/combat/WSS2MetaShell.tsx` | Meta shop UI, 5 perks catalog, currency wallet, localStorage persistence | ~800+ |
| `artifacts/a-forgotten-place/src/combat/Combat.tsx` | Top-level mode picker; project name display | ~200 |
| `artifacts/wss2-deck/src/data/slides-manifest.json` | Manifest of the 13-slide presentation deck | small |

## How to Verify the Code Matches the Documentation

1. **Use cases ↔ source:** every UC-FE-* in the Test Case Spec (`04-test-case-spec.md` §2) maps to a code path inside `WSSPhase3.tsx` or `WSS2MetaShell.tsx`. Search for `// UC-FE-XX` markers (where present) or use the file map above.
2. **Activity diagram AD-1 (Game Tick Loop) ↔ source:** the Sense → Decide → Act → Spawn → Cleanup ordering is enforced inside the main `tick()` function in `WSSPhase3.tsx`.
3. **Sequence diagram SD-3 (Perk Purchase) ↔ source:** see `purchasePerk()` in `WSS2MetaShell.tsx`. The cap-check → scrap-check → commit → persist sequence is one tight block.
4. **Spec-driven self-test:** at module load, `WSSPhase3.tsx` runs `computeNightBonus(known inputs)` and throws if the result diverges from the documented formula. Open the browser console on first load — if the formula is still correct, you'll see no errors.

## License & Attribution

- Course-project codebase, no external commercial license.
- AI tools (ChatGPT, Claude, Replit Agent) used for boilerplate, diagram generation, and documentation drafting per CS 4800 course policy. All architectural decisions and non-trivial gameplay code authored by Casey Wong.
- Third-party runtime dependencies: React, Vite, TypeScript, Tailwind CSS — all open-source under MIT/BSD-style licenses; full list in each artifact's `package.json`.
