# Activity Diagrams — WSS2 *A Forgotten Place*

**Document type:** Functional Spec — Activity Diagrams (BA deliverable)
**Notation:** UML 2.5 Activity Diagrams expressed in Mermaid `flowchart` syntax (renders natively on GitHub and most Markdown previewers).

Three activity diagrams are provided, covering the three most behaviorally important flows in the simulation.

---

## AD-1 — Game Tick Loop (60 Hz)

The master tick loop runs at 60 ticks/sec and processes every entity through five ordered phases.

```mermaid
flowchart TD
  Start([Tick fires from RAF/setInterval]) --> Adv[Advance simulation time]
  Adv --> DN{Day or Night?}
  DN -->|Day, t < DAY_LENGTH| Sense
  DN -->|Night, t < NIGHT_LENGTH| SenseN[Sense — apply night LOS / hearing modifiers x1.6]
  Sense[Sense — each entity perceives world] --> Decide
  SenseN --> Decide
  Decide[Decide — entity brain selects next intent] --> Act
  Act[Act — apply intent, resolve movement / combat] --> Spawn
  Spawn[Spawn — corruption nests emit zombies if pool allows] --> Cleanup
  Cleanup[Cleanup — remove dead, resolve drops] --> Phase{Cycle phase ended?}
  Phase -->|Day -> Night| FlipNight[Toggle to Night, dim overlay, boost zombie senses]
  Phase -->|Night -> Day| FlipDay[Toggle to Day, award night-bonus Scrap]
  Phase -->|No| Render
  FlipNight --> Render
  FlipDay --> Render
  Render[Render frame to canvas + HUD] --> End([Wait for next tick])
```

**Why this diagram matters:** the strict ordering Sense → Decide → Act → Spawn → Cleanup is the contract that lets the AI be deterministic across replays of the same seed. Any code that violates the order (e.g. an entity that moves during Sense) creates non-reproducible bugs.

---

## AD-2 — Survivor Decision Tick (per-survivor brain)

Each survivor runs this decision flow every tick (or every 5 ticks in low-CPU fallback).

```mermaid
flowchart TD
  Start([Brain tick]) --> HP{HP < critical threshold?}
  HP -->|Yes| Med{Medkit in inventory?}
  Med -->|Yes| UseMed[Use Medkit -> heal -> set cooldown]
  Med -->|No| Flee[Flee from nearest threat]
  HP -->|No| Spot{Hostile in line-of-sight?}
  Spot -->|Yes| Engage{Has ranged ammo?}
  Engage -->|Yes & range OK| Shoot[Aim and fire ranged weapon]
  Engage -->|No or out of range| Melee[Close distance and melee]
  Spot -->|No| Heard{Heard a threat recently?}
  Heard -->|Yes| Investigate[Move toward last sound]
  Heard -->|No| Loot{Loot socket within radius?}
  Loot -->|Yes| Scavenge[Path to socket -> open -> add to inventory]
  Loot -->|No| Obj{Active objective enabled?}
  Obj -->|Yes| Pursue[Path toward objective compass]
  Obj -->|No| Wander[Wander within current room]
  UseMed --> End([Emit intent for tick])
  Flee --> End
  Shoot --> End
  Melee --> End
  Investigate --> End
  Scavenge --> End
  Pursue --> End
  Wander --> End
```

**Implementation note:** this priority list is encoded as a 6-state machine in `src/combat/WSSPhase3.tsx`. The order is the priority order — earlier branches win. This is the documented "Survivor AI" slide in the deck (slide 5).

---

## AD-3 — Run End → Meta Shop → New Run

The full meta-loop: a run ends, score is computed, scrap is awarded, the player shops, then a new run begins.

```mermaid
flowchart TD
  Start([All survivors dead OR all evacuated]) --> Reason{End reason?}
  Reason -->|Wipe| Loss[Mark run as LOSS]
  Reason -->|Evac| Win[Mark run as WIN]
  Loss --> Score
  Win --> Score
  Score[Compute run grade S/A/B/C/D/F<br/>from objectives, evac %, time, loot] --> Bonus
  Bonus[Compute night bonus<br/>round nightKills*2 + nightEvac*5 * scrapMult] --> Award
  Award[Add scrap to wallet, persist to localStorage] --> Show
  Show[Show run-end breakdown panel] --> Shop{Player opens Meta Shop?}
  Shop -->|Yes| Browse[Browse gear and perks]
  Browse --> Buy{Affordable and not at cap?}
  Buy -->|Yes| Purchase[Deduct scrap, add to permanent loadout, persist]
  Buy -->|No| Browse
  Purchase --> Browse
  Shop -->|Done shopping| NewRun[Start new run with updated loadout]
  NewRun --> End([Tick loop resumes — see AD-1])
```

**Spec-driven self-test:** the night-bonus formula `round((nightKills * 2 + nightEvac * 5) * scrapMult)` is asserted by an in-code self-test inside `computeNightBonus` at module load. Any drift between the displayed formula and the implementation throws immediately, before the player ever sees a wrong number.

---

*Source files referenced: `artifacts/a-forgotten-place/src/combat/WSSPhase3.tsx`, `artifacts/a-forgotten-place/src/combat/WSS2MetaShell.tsx`*
