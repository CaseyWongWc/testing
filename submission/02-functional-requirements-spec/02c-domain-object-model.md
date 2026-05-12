# Domain Object Model — WSS2 *A Forgotten Place*

**Document type:** Functional Spec — Domain Object Model (BA deliverable)
**Notation:** UML class diagram in Mermaid `classDiagram` syntax. Shows the *problem-domain* concepts and their relationships, independent of the React/TypeScript implementation. Cardinalities follow standard UML (`1`, `0..1`, `0..*`, `1..*`).

The class-implementation hierarchy (TypeScript types, React components) lives in the Technical/Design Spec → `03d-class-hierarchy.md`. This document is the *what*, not the *how*.

---

## Domain Class Diagram

```mermaid
classDiagram
  class Run {
    +seed: int
    +mapSize: int
    +startedAt: timestamp
    +endedAt: timestamp
    +outcome: WIN|LOSS
    +grade: S|A|B|C|D|F
    +nightKills: int
    +nightEvacuations: int
    +scrapAwarded: int
  }

  class Map {
    +width: int
    +height: int
    +biome: Biome
    +seed: int
    +tiles: Tile[][]
  }

  class Tile {
    +x: int
    +y: int
    +terrain: TerrainType
    +explored: bool
    +visible: bool
  }

  class Survivor {
    +id: string
    +name: string
    +hp: int
    +maxHp: int
    +personality: Personality
    +x: float
    +y: float
    +alive: bool
  }

  class Zombie {
    +id: string
    +variant: Walker|Runner|Brute
    +hp: int
    +speed: float
    +alertRadius: float
    +x: float
    +y: float
  }

  class CorruptionNest {
    +id: string
    +size: Small|Medium|Large
    +energyPool: int
    +zombiesPerWave: int
  }

  class Inventory {
    +capacity: int
    +items: Item[]
  }

  class Item {
    <<abstract>>
    +id: string
    +name: string
  }

  class Weapon {
    +damage: int
    +range: float
    +ammo: int
    +reloadTime: float
  }

  class Medkit {
    +healAmount: int
    +charges: int
  }

  class Objective {
    +id: string
    +type: ActivateSwitch|Survive|Extract|DestroyNests|Collect|Rescue
    +position: Point
    +completed: bool
  }

  class RiftPortal {
    +position: Point
    +sealed: bool
  }

  class Wallet {
    +scrap: int
  }

  class MetaShop {
    +gearCatalog: GearOffer[]
    +perkCatalog: Perk[]
  }

  class Perk {
    +id: string
    +name: string
    +cost: int
    +cap: int
    +purchasedCount: int
  }

  class Player {
    +observerName: string
    +wallet: Wallet
    +permanentLoadout: GearOffer[]
    +ownedPerks: Perk[]
  }

  Player "1" --> "1" Wallet : owns
  Player "1" --> "0..*" Run : observes
  Player "1" --> "1" MetaShop : interacts with
  MetaShop "1" --> "0..*" Perk : offers
  Run "1" --> "1" Map : takes place on
  Run "1" --> "1..*" Survivor : tracks
  Run "1" --> "0..*" Zombie : tracks
  Run "1" --> "1..*" Objective : has
  Run "1" --> "0..1" RiftPortal : exits via
  Map "1" *-- "many" Tile : composed of
  Map "1" --> "0..*" CorruptionNest : contains
  CorruptionNest "1" --> "0..*" Zombie : spawns
  Survivor "1" --> "1" Inventory : carries
  Inventory "1" --> "0..*" Item : holds
  Weapon --|> Item
  Medkit --|> Item
```

---

## Key Domain Rules (encoded by the model)

1. **A Player observes many Runs but lives in only one persistent meta-state** — `Wallet`, `permanentLoadout`, and `ownedPerks` survive across runs (persisted to localStorage); everything inside a `Run` is ephemeral.
2. **Runs need at least one Survivor** (`1..*`) — a run with zero survivors is by definition over (LOSS).
3. **Runs need at least one Objective** — there's no such thing as a goalless run; even sandbox modes wrap in a `Survive(N ticks)` objective.
4. **A RiftPortal is optional on a Run** (`0..1`) — early tutorial maps and infinite survival modes don't have one.
5. **Zombies are owned by Runs, not by Nests** — a nest can be destroyed without despawning the zombies it already produced; this matches the gameplay rule "killing the nest stops the bleeding but doesn't clean up the spawn."
6. **Items are abstract** — `Weapon` and `Medkit` are the two concrete subtypes used in this submission; the class is abstract so future items (Grenade, Trap) slot in without schema changes.
7. **Perks are *capped*, not unlocked** — `purchasedCount <= cap`. Perks are stackable up to the cap (e.g. Iron Will rank 1, 2, 3) rather than boolean unlocks.

---

## ER Variant (for the data persistence layer)

If the domain model were translated to a relational schema for persistence (currently localStorage JSON, but hypothetically a SQL backend), the entity-relationship view would collapse value objects into columns and keep only the persistent entities:

```mermaid
erDiagram
  PLAYER ||--|| WALLET : owns
  PLAYER ||--o{ OWNED_PERK : owns
  PLAYER ||--o{ OWNED_GEAR : owns
  PLAYER ||--o{ RUN_HISTORY : recorded
  RUN_HISTORY ||--|| RUN_RESULT : produced

  PLAYER {
    string id PK
    string observerName
    timestamp createdAt
  }
  WALLET {
    string playerId PK,FK
    int scrap
  }
  OWNED_PERK {
    string playerId PK,FK
    string perkId PK
    int rank
  }
  OWNED_GEAR {
    string playerId PK,FK
    string gearId PK
    int count
  }
  RUN_HISTORY {
    string runId PK
    string playerId FK
    int seed
    timestamp startedAt
    timestamp endedAt
  }
  RUN_RESULT {
    string runId PK,FK
    string outcome
    string grade
    int nightKills
    int nightEvacuations
    int scrapAwarded
  }
```

The current implementation persists only the left half of this diagram (Player + Wallet + OwnedPerk + OwnedGear) to localStorage. `RUN_HISTORY` is in-memory only — surfacing it to a persistent store is on the post-class roadmap.
