# Class Hierarchy & Relationships — WSS2 *A Forgotten Place*

**Document type:** Technical Spec — Class Hierarchy & Relationship Diagrams (DEV deliverable)
**Notation:** UML 2.5 Class Diagram in Mermaid `classDiagram` syntax. This is the *implementation-level* class diagram (how the TypeScript code is organized), as opposed to the conceptual Domain Object Model in `02-functional-requirements-spec/02c-domain-object-model.md` (what the *problem domain* looks like).

---

## CH-1 — Core simulation class hierarchy

```mermaid
classDiagram
  class Entity {
    <<abstract>>
    +id: string
    +x: float
    +y: float
    +alive: bool
    +sense(world) Perception
    +decide(perception) Intent
    +act(intent, world) void
  }

  class Survivor {
    +hp: int
    +maxHp: int
    +personality: Personality
    +inventory: Inventory
    +brain: SurvivorBrain
    +decide(perception) Intent
  }

  class Zombie {
    <<abstract>>
    +hp: int
    +speed: float
    +alertRadius: float
    +variant: ZombieVariant
  }

  class Walker {
    +speed = 0.6
    +alertRadius = 6
  }
  class Runner {
    +speed = 1.4
    +alertRadius = 8
  }
  class Brute {
    +hp = 4x
    +speed = 0.4
    +alertRadius = 5
  }

  class CorruptionNest {
    +size: NestSize
    +energyPool: int
    +cooldown: int
    +trySpawn(world) Zombie?
  }

  class HostileHuman {
    +faction = HOSTILE
    +brain: SurvivorBrain
  }

  Entity <|-- Survivor
  Entity <|-- Zombie
  Entity <|-- HostileHuman
  Entity <|-- CorruptionNest
  Zombie <|-- Walker
  Zombie <|-- Runner
  Zombie <|-- Brute
```

**Note:** `HostileHuman` reuses `SurvivorBrain` intentionally — the AI for hostile humans is the same decision engine as for survivors, just with `faction = HOSTILE`. This is the canonical use case for the *Strategy Pattern* in this codebase (see `.local/tasks/strategy-pattern-future-phase.md`).

---

## CH-2 — Survivor AI brain hierarchy

```mermaid
classDiagram
  class SurvivorBrain {
    <<interface>>
    +decide(perception, state) Intent
  }

  class Phase3Brain {
    +priorityList: PriorityState[]
    +decide(perception, state) Intent
    -evalCriticalHP(state) Intent?
    -evalSpotted(perception) Intent?
    -evalHeard(perception) Intent?
    -evalLoot(perception) Intent?
    -evalObjective(state) Intent?
    -evalWander(state) Intent
  }

  class PersonalityWeights {
    +aggression: float
    +caution: float
    +scavenging: float
    +loyalty: float
  }

  class Perception {
    +visibleEnemies: Entity[]
    +heardSounds: Sound[]
    +nearbyLoot: LootSocket[]
    +activeObjective: Objective?
  }

  class Intent {
    <<enum>>
    Move
    Attack
    Reload
    UseItem
    Wander
    Flee
  }

  SurvivorBrain <|.. Phase3Brain
  Phase3Brain --> PersonalityWeights : weighted by
  Phase3Brain ..> Perception : reads
  Phase3Brain ..> Intent : produces
```

---

## CH-3 — Meta-progression classes

```mermaid
classDiagram
  class MetaShell {
    +wallet: Wallet
    +loadout: PermanentLoadout
    +ownedPerks: Map~PerkId, int~
    +purchaseGear(GearOffer) Result
    +purchasePerk(PerkId) Result
    +persistToLocalStorage() void
    +loadFromLocalStorage() void
  }

  class Wallet {
    +scrap: int
    +add(amount) void
    +deduct(amount) Result
  }

  class PermanentLoadout {
    +pistol: int
    +shotgun: int
    +medkit: int
    +extraSurvivor: int
  }

  class Perk {
    <<abstract>>
    +id: PerkId
    +name: string
    +cost: int
    +cap: int
    +applyTo(survivor) void
  }

  class IronWill { +bonusHp }
  class ScrapMagnet { +scrapMultiplier }
  class QuickHands { +reloadSpeedMultiplier }
  class SharpSenses { +visionMultiplier }
  class StarterCache { +startingItems }

  MetaShell --> Wallet : owns
  MetaShell --> PermanentLoadout : owns
  MetaShell --> "0..*" Perk : tracks
  Perk <|-- IronWill
  Perk <|-- ScrapMagnet
  Perk <|-- QuickHands
  Perk <|-- SharpSenses
  Perk <|-- StarterCache
```

---

## Design rationale (key relationships)

| Decision | Rationale |
|---|---|
| `Entity` is abstract with `sense → decide → act` contract | Forces every actor to fit the master tick-loop ordering; you cannot add an entity that bypasses the contract |
| `Zombie` is abstract; variants inherit | New zombie types (`Spitter`, `Screamer`) become a new subclass — open/closed principle |
| `SurvivorBrain` is an interface, not a base class | Lets the *brain* be swapped per-survivor (or eventually per-personality, or per-LLM) without touching `Survivor` |
| `Perk` is abstract with `applyTo(survivor)` | Each perk encapsulates its own effect; `MetaShell` doesn't know what any specific perk does |
| `MetaShell` is the only class that touches `localStorage` | Single chokepoint for persistence — everything else is in-memory and serializable |

---

*Source files: `artifacts/a-forgotten-place/src/combat/WSSPhase3.tsx` (Entity, Zombie, Survivor), `artifacts/a-forgotten-place/src/combat/WSS2MetaShell.tsx` (MetaShell, Wallet, Perks)*
