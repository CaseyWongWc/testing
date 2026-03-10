import { Client } from '@notionhq/client';

let connectionSettings;
async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? 'depl ' + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) throw new Error('X-Replit-Token not found');
  connectionSettings = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion', { headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken } }).then(r => r.json()).then(d => d.items?.[0]);
  return connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
}

function h1(t) { return { object: "block", type: "heading_1", heading_1: { rich_text: [{ type: "text", text: { content: t } }] } }; }
function h2(t) { return { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: t } }] } }; }
function h3(t) { return { object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: t } }] } }; }
function p(t) { return { object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: t } }] } }; }
function li(t) { return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: t } }] } }; }
function liB(bold, rest) { return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: bold }, annotations: { bold: true } }, { type: "text", text: { content: rest } }] } }; }
function div() { return { object: "block", type: "divider", divider: {} }; }
function code(lang, content) { return { object: "block", type: "code", code: { language: lang, rich_text: [{ type: "text", text: { content } }] } }; }
function callout(emoji, t) { return { object: "block", type: "callout", callout: { icon: { type: "emoji", emoji }, rich_text: [{ type: "text", text: { content: t } }] } }; }
function embed(url) { return { object: "block", type: "embed", embed: { url } }; }
function bookmark(url) { return { object: "block", type: "bookmark", bookmark: { url } }; }

async function main() {
  const token = await getAccessToken();
  const notion = new Client({ auth: token });

  // The existing Exercise 4 page
  const ex4PageId = "31f0e51f-71de-8105-a9a5-cdf69d32769c";

  // First, get existing blocks to append after them
  const existing = await notion.blocks.children.list({ block_id: ex4PageId, page_size: 100 });
  console.log("Existing blocks:", existing.results.length);

  // Append the visual diagrams section
  const batch1 = [
    div(),
    h1("Visual Architecture Diagrams"),
    callout("\uD83C\uDFA8", "Two diagram formats: Eraser.io for detailed visual with icons and colors, Mermaid for LLM-readable code that renders natively in Notion."),
    div(),

    h2("Eraser.io Diagram (Full Detail)"),
    p("Interactive architecture diagram with color-coded layers, icons for each component, and labeled connections. Click to view/edit in Eraser.io:"),
    bookmark("https://app.eraser.io/workspace/rvzt0LALdbS9922i1909?origin=share"),
    p("Features: Blue = Presentation Layer, Green = Application Layer, Orange = Data/Infrastructure Layer, Gray = Tech Stack. All 4 actors, all subsystems with icons, entity hierarchy, and labeled data flow arrows."),
    div(),

    h2("Mermaid Diagram (LLM-Accessible Overview)"),
    p("High-level architecture overview that renders natively in Notion and is readable by both humans and LLMs. Intentionally simplified to keep the diagram clean and readable."),
  ];
  await notion.blocks.children.append({ block_id: ex4PageId, children: batch1 });
  console.log("Batch 1 done (headers + Eraser section)");

  // Mermaid code block
  const mermaidCode1 = `graph TD
  OBS["Observer (Human)"]
  GE["Game Engine"]
  AIS["AI Survivors"]
  EAI["Enemy AI"]

  subgraph PL["PRESENTATION LAYER"]
    UI["Observer UI Controls"]
    CAM["Camera System (4 modes)"]
    HUD["HUD Overlay"]
    MENU["Menus & Config"]
    CANVAS["Canvas Rendering Engine"]
  end

  subgraph AL["APPLICATION LAYER"]
    GLC["Game Loop Controller (60 tps)"]
    subgraph AISYS["AI System"]
      BRAIN["Brain Interface"]
      INTENT["Intent System"]
    end
    subgraph COMBAT["Combat System"]
      WEAPON["Weapon Manager"]
      DAMAGE["Damage Calculator"]
    end
    subgraph WORLD["World Systems"]
      MAPGEN["Map Generator"]
      OBJ["Objective System"]
      SPAWN["Spawner System"]
      FOW["Fog-of-War"]
    end
    NAV["Navigation & Pathfinding (A*)"]
    PROG["Progression & Economy"]
  end`;

  const mermaidCode2 = `  subgraph DL["DATA / INFRASTRUCTURE LAYER"]
    WS["World State"]
    GRID["GridMap (2D Tile Array)"]
    STAMP["Stamp Library"]
    BIOME["Biome Definitions"]
    PRNG["Seeded PRNG"]
  end

  subgraph TECH["TECHNOLOGY STACK"]
    T1["React 18 + TypeScript"]
    T2["Vite + Canvas API"]
    T3["Express 5 + WebSocket"]
    T4["Tailwind CSS"]
    T5["In-Memory State"]
  end

  OBS -->|"Configure & Watch"| PL
  GE -->|"Tick Loop"| AL
  AIS -->|"Autonomous Actions"| AL
  EAI -->|"Autonomous Actions"| AL
  PL -->|"Reads State"| AL
  AL -->|"Renders"| PL
  AL -->|"Read/Write"| DL
  GLC --> AISYS
  GLC --> COMBAT
  GLC --> WORLD
  AISYS -->|"Attack Intents"| COMBAT
  COMBAT -->|"Noise Alerts"| WORLD
  AISYS --> NAV
  OBJ --> PROG`;

  const batch2 = [
    code("mermaid", mermaidCode1),
    code("mermaid", mermaidCode2),
    p("(Both code blocks above combine into one complete Mermaid diagram. Copy both into a single code block to render the full diagram.)"),
    div(),

    h2("Diagram Comparison"),
    liB("Eraser.io (Full Detail): ", "All 4 actors, 5 Presentation components, 3 Application subsystems (AI System with 5 components, Combat System with 5 components, World Systems with 8 components), 2 shared systems, 5 Data Layer stores + Entity Hierarchy (7 entity types), 6 Tech Stack items. Total: 45+ components with icons and color coding."),
    liB("Mermaid (High-Level): ", "All 4 actors, 5 Presentation components, 3 Application subsystems (simplified to key components), 2 shared systems, 5 Data Layer stores, 5 Tech Stack items. Intentionally simplified for readability. Renders natively in Notion."),
    div(),

    h2("What the Diagram Shows"),
    p("WSS2 uses a Layered Architecture with 3 main layers connected by defined interfaces:"),
    liB("Presentation Layer (Blue): ", "What the Observer sees. Camera system with 4 view modes, HUD overlay with health/objectives/compass, pre-game configuration menus, and the Canvas Rendering Engine using HTML5 Canvas 2D with a 5-layer paper-doll sprite compositing system."),
    liB("Application Layer (Green): ", "The core game logic. Game Loop Controller runs at 60 ticks/sec with Sense-Decide-Act-Spawn-Cleanup phases. Contains AI System (9+ brain types with Intent-based decision making), Combat System (weapons, armor, cover, noise propagation, friendly fire), and World Systems (procedural map generation, Corruption Nest spawners, 6 objective types, fog-of-war, Rift Portal progression)."),
    liB("Data/Infrastructure Layer (Orange): ", "All game state. World State holds entity registries and faction tables. GridMap stores 2D tile arrays with terrain properties. Stamp Library provides 12-20 building templates. Seeded PRNG ensures deterministic generation (Golden Seed Test: seed 12345, 30x30, 300 ticks)."),
    liB("Technology Stack (Gray): ", "React 18 + TypeScript, Vite, HTML5 Canvas API, Tailwind CSS, Express 5 + WebSocket. All state in-memory, no database."),
  ];
  await notion.blocks.children.append({ block_id: ex4PageId, children: batch2 });
  console.log("Batch 2 done (Mermaid + comparison + explanation)");

  console.log("\nDone! Visual diagrams section added to Exercise 4 page.");
}

main().catch(e => console.error(e));
