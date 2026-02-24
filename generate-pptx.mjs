import pptxgen from 'pptxgenjs';
import fs from 'fs';

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Casey Wong';
pptx.title = 'WSS2 - A Forgotten Place';

const BG = '1a1a2e';
const ACCENT = '4a9eff';
const TEXT = 'e0e0e0';
const SUBTEXT = 'a0a0b0';
const CARD_BG = '252540';

function addSlide({ title, content, notes, isTitle = false }) {
  const slide = pptx.addSlide();
  slide.background = { color: BG };
  if (notes) slide.addNotes(notes);

  if (isTitle) {
    slide.addText(title, { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 40, bold: true, color: ACCENT, fontFace: 'Arial', align: 'center' });
    if (content) {
      slide.addText(content, { x: 0.5, y: 3.2, w: '90%', h: 2.5, fontSize: 18, color: TEXT, fontFace: 'Arial', align: 'center', valign: 'top' });
    }
  } else {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: '16213e' } });
    slide.addText(title, { x: 0.5, y: 0.1, w: '90%', h: 0.7, fontSize: 28, bold: true, color: ACCENT, fontFace: 'Arial' });
    if (content) {
      slide.addText(content, { x: 0.5, y: 1.1, w: 12, h: 5.8, fontSize: 15, color: TEXT, fontFace: 'Arial', valign: 'top', lineSpacingMultiple: 1.3 });
    }
  }
  return slide;
}

function makeCards(slide, cards, y = 1.2) {
  const cardW = (12 / cards.length) - 0.2;
  cards.forEach((card, i) => {
    const x = 0.5 + i * (cardW + 0.2);
    slide.addShape(pptx.ShapeType.rect, { x, y, w: cardW, h: 4.5, fill: { color: CARD_BG }, rectRadius: 0.1 });
    slide.addText(card.label, { x: x + 0.2, y: y + 0.2, w: cardW - 0.4, h: 0.5, fontSize: 12, bold: true, color: ACCENT, fontFace: 'Arial' });
    slide.addText(card.text, { x: x + 0.2, y: y + 0.8, w: cardW - 0.4, h: 3.5, fontSize: 13, color: TEXT, fontFace: 'Arial', valign: 'top', lineSpacingMultiple: 1.2 });
  });
}

// SLIDE 1 - Title
const s1 = pptx.addSlide();
s1.background = { color: BG };
s1.addText('Wilderness Survival Systems', { x: 0.5, y: 1.0, w: '90%', h: 1.0, fontSize: 42, bold: true, color: ACCENT, fontFace: 'Arial', align: 'center' });
s1.addText('WSS2', { x: 0.5, y: 2.0, w: '90%', h: 0.8, fontSize: 56, bold: true, color: 'ffffff', fontFace: 'Arial', align: 'center' });
s1.addText('Feature-Rich Survival Simulation', { x: 0.5, y: 3.0, w: '90%', h: 0.6, fontSize: 20, color: SUBTEXT, fontFace: 'Arial', align: 'center' });
s1.addShape(pptx.ShapeType.rect, { x: 4.5, y: 3.9, w: 4, h: 0.04, fill: { color: ACCENT } });
s1.addText('PRESENTED BY', { x: 0.5, y: 4.2, w: '90%', h: 0.4, fontSize: 11, color: SUBTEXT, fontFace: 'Arial', align: 'center' });
s1.addText('Casey Wong', { x: 0.5, y: 4.6, w: '90%', h: 0.6, fontSize: 22, bold: true, color: TEXT, fontFace: 'Arial', align: 'center' });

// SLIDE 2 - Executive Pitch
const s2 = addSlide({
  title: 'Executive Pitch',
  notes: "WSS2 is a zero-player survival simulation — meaning the AI controls everything. You set it up, hit go, and watch. What makes it unique is the modular brain system. Each agent has a Vision module that gathers sensory data, and a separate Brain module that makes decisions based on that data. This separation means we can swap out brains, compare strategies side-by-side, and actually measure which AI performs better in the same situation. It's both a game and a research tool for studying AI decision-making."
});
makeCards(s2, [
  { label: 'REAL-TIME SIMULATION', text: 'WSS2 offers an engaging real-time multi-agent survival simulation, allowing players to explore, manage resources, and complete objectives while navigating a rich wilderness environment.' },
  { label: 'MODULAR AI ARCHITECTURE', text: 'The unique modular AI architecture separates perception from decision-making, enabling measurable strategy comparisons and providing deep insights into AI behavior dynamics within the simulation.' }
]);

// SLIDE 3 - Product Goals
const s3 = addSlide({
  title: 'Product Goals and Outcomes',
  notes: "Two big goals here. First — a stable core loop. That means the game consistently runs from start to finish without crashing. Agents spawn, they explore, they fight, they complete objectives, they unlock the portal, and they evacuate. Every run. Reliably. Second — observability. We want you to be able to watch any agent, see exactly what it's thinking, why it made a decision, and what it plans to do next. This is critical for debugging but it's also what makes the simulation fun to watch. You're not just seeing random movement — you're seeing reasoning."
});
makeCards(s3, [
  { label: 'STABLE CORE LOOP', text: 'Our primary objective is to deliver a stable, replayable core loop where agents complete objectives, unlock the rift portal, and coordinate their evacuation seamlessly, ensuring engaging gameplay.' },
  { label: 'OBSERVABLE AI BEHAVIOR', text: 'We aim to make AI behavior observable and debuggable, enabling developers to analyze intent selection and event-driven interrupts, fostering a deeper understanding of AI interactions during gameplay.' }
]);

// SLIDE 4 - System Flow
const s4 = addSlide({
  title: 'End-to-End System Flow Overview',
  notes: "This is the heartbeat of WSS2 — the Sense-Decide-Act loop. Every single tick, every agent goes through this cycle. Sense: the Vision module scans the surroundings — what tiles can I see? Are there zombies? Loot? Other survivors? Decide: the Brain module takes all that input and picks an intent — should I run, fight, scavenge, or trade? Act: the agent actually does it — moves, shoots, picks up items, negotiates. This runs 60 times per second. The key innovation is that Sense and Decide are separate modules, so you can swap them independently."
});
makeCards(s4, [
  { label: 'SENSE', text: 'The system begins by updating vision and fog states, detecting threats, loot, traders, and objectives, enabling agents to maintain situational awareness in real-time.' },
  { label: 'DECIDE', text: 'Agents evaluate their self-status, goals, and urgency to select intents, while immediate interruptions arise from critical events to ensure quick reactions to changes in the environment.' },
  { label: 'ACT', text: 'Agents execute moves, interact, fight, trade, or accomplish objectives, translating decisions into physical actions within the simulation to progress towards survival goals.' }
]);

// SLIDE 5 - Locked Scope
const s5 = addSlide({
  title: 'Locked Scope',
  notes: "These are the design decisions we've locked in — they're not changing. The simulation runs at 60 ticks per second, which is fast enough for smooth real-time combat. Agents need to complete objectives like activating switches or destroying enemy nests before they can unseal the rift portal and evacuate. Friendly fire is always on, which forces the AI to be smart about positioning. Melee weapons have durability and will break. Guns need to be reloaded, but agents can keep moving while reloading. And the world uses fog of war — agents only see what's in their line of sight, and the team shares vision."
});
const scopeItems = [
  { text: '60 ticks per second', desc: 'Real-time combat and movement' },
  { text: 'Rift Portal evacuation', desc: 'Complete objectives to unseal the exit and evacuate' },
  { text: 'Friendly fire ON', desc: 'Full damage to allies forces smart AI positioning' },
  { text: 'Melee durability', desc: 'Weapons break after use, requiring resource management' },
  { text: 'Reload mechanics', desc: 'Guns have reload times; agents can move during reloads' },
  { text: 'Sub-tile movement', desc: 'Grid-based world with smooth entity positioning' },
  { text: 'Fog of war', desc: 'Shared team vision with fog mechanics' },
];
scopeItems.forEach((item, i) => {
  const y = 1.2 + i * 0.65;
  s5.addShape(pptx.ShapeType.rect, { x: 1.5, y, w: 10, h: 0.55, fill: { color: CARD_BG }, rectRadius: 0.05 });
  s5.addText(item.text, { x: 1.7, y, w: 3.5, h: 0.55, fontSize: 14, bold: true, color: ACCENT, fontFace: 'Arial', valign: 'middle' });
  s5.addText(item.desc, { x: 5.2, y, w: 6, h: 0.55, fontSize: 13, color: TEXT, fontFace: 'Arial', valign: 'middle' });
});

// SLIDE 6 - World and Map
const s6 = addSlide({
  title: 'World and Map Design',
  notes: "The world is procedurally generated — every run is different. We support three map sizes: 30x30 for quick games, 40x40 for standard play, and 60x60 for large-scale simulations with up to 5 survivors. The terrain generator creates biomes, places buildings from a stamp library of 12-20 templates, and scatters loot and enemies. Buildings aren't random boxes — they're weighted by biome type, so you'll find hospitals in urban areas and cabins in forests. Every playthrough gives you a completely new map to explore."
});
makeCards(s6, [
  { label: 'CONFIGURABLE MAP SIZES', text: 'WSS2 offers flexible map sizes of 30x30, 40x40, and 60x60 grids, accommodating varying survivor counts from 1 to 5. This allows for tailored gameplay experiences.' },
  { label: 'PROCEDURAL GENERATION', text: 'The game leverages procedural generation techniques for terrain, buildings, and loot placements, ensuring unique environments for each playthrough while enhancing immersion and replayability.' }
]);

// SLIDE 7 - Loot
const s7 = addSlide({
  title: 'Loot, Economy, and Progression',
  notes: "Resources and economy are a big part of survival. Loot is more common indoors than outdoors — buildings have containers and scattered items, while outside is sparser. Agents can also get items from trading with merchants or looting defeated enemies. There's a quality scaling system — loot quality is driven primarily by difficulty level, with a mild bonus for items found farther from spawn. Themed containers add immersion: hospitals drop medical supplies, military buildings drop weapons and ammo. This ties directly into the trading system — an agent might find a health potion but decide to trade it for food because their hunger is more urgent."
});
makeCards(s7, [
  { label: 'LOOT DISTRIBUTION', text: 'Loot is strategically clustered in buildings and limited outdoor spawns, allowing agents to explore and gather resources efficiently while increasing the thrill of discovery.' },
  { label: 'LOOT SOURCES', text: 'Loot is generated from pre-placed sources within the environment and drops from defeated human enemies, ensuring a dynamic and rewarding collection experience.' },
  { label: 'QUALITY SCALES', text: 'The quality of loot scales with difficulty levels, featuring themed containers that enhance immersion, such as medical vs military supplies.' }
]);

// SLIDE 8 - Combat
const s8 = addSlide({
  title: 'Combat Mechanics and Weaponry',
  notes: "Combat is real-time at 60 ticks per second. There are three weapon classes: fists, melee weapons, and guns. Melee weapons have durability — they break after enough use, so agents need to manage their arsenal. Guns require reloading, and agents can move while reloading but take a penalty if they get hit. Friendly fire is always on, which forces the AI to be smart about positioning. The weapon system is designed to be expandable — we can add new weapon types without rewriting the combat core. There's also a noise mechanic where loud weapons attract more enemies."
});
makeCards(s8, [
  { label: 'WEAPONS', text: 'The game features a diverse arsenal with melee and ranged weapons, incorporating durability mechanics for realism and strategy in combat scenarios.' },
  { label: 'FRIENDLY FIRE', text: 'Friendly fire mechanics encourage teamwork and coordination among agents, as positioning becomes crucial to avoid unintended damage during intense encounters.' },
  { label: 'ARSENAL EXPANSION', text: 'The system supports broad expansion of weapon types and functionalities without disrupting core combat rules, allowing continuous innovation in gameplay.' }
]);

// SLIDE 9 - AI Architecture
const s9 = addSlide({
  title: 'AI Architecture and Brain Model',
  notes: "This is the core innovation. The brain model runs on a hybrid system — tick-based decisions every frame, with event-driven interrupts for urgent situations like getting shot or spotting a zombie. We have 5 different brain types. Balanced tries to do a bit of everything. Aggressive charges into threats and prioritizes combat. Cautious plays it safe and avoids risk when possible. Survivalist focuses on gathering resources and staying alive. Money-Driven prioritizes gold and trading opportunities. You can configure which brain each agent uses, and you can watch how different brains handle the same situation completely differently. [TRANSITION: Let me switch over to the live demo now and show you this in action.]"
});
s9.addText('Hybrid tick-based + event-driven system\nEvery tick: Sense → Decide → Act', { x: 0.5, y: 1.1, w: 12, h: 0.7, fontSize: 15, color: SUBTEXT, fontFace: 'Arial', italic: true });
const brains = [
  { name: 'Balanced', icon: '⚖️', desc: 'Weighs all survival needs equally' },
  { name: 'Aggressive', icon: '⚔️', desc: 'Charges into threats, prioritizes combat' },
  { name: 'Cautious', icon: '🛡️', desc: 'Plays it safe, avoids unnecessary risk' },
  { name: 'Survivalist', icon: '🎒', desc: 'Focuses on resource gathering and self-preservation' },
  { name: 'Money-Driven', icon: '💰', desc: 'Prioritizes gold, trading, and economic advantage' },
];
brains.forEach((b, i) => {
  const x = 0.5 + i * 2.5;
  s9.addShape(pptx.ShapeType.rect, { x, y: 2.0, w: 2.3, h: 3.5, fill: { color: CARD_BG }, rectRadius: 0.1 });
  s9.addText(b.icon, { x, y: 2.2, w: 2.3, h: 0.8, fontSize: 36, align: 'center', fontFace: 'Arial' });
  s9.addText(b.name, { x: x + 0.1, y: 3.0, w: 2.1, h: 0.5, fontSize: 15, bold: true, color: ACCENT, fontFace: 'Arial', align: 'center' });
  s9.addText(b.desc, { x: x + 0.15, y: 3.5, w: 2.0, h: 1.8, fontSize: 12, color: TEXT, fontFace: 'Arial', align: 'center', valign: 'top' });
});

// SLIDE 10 - Roadmap
const s10 = addSlide({
  title: 'Development Roadmap',
  notes: "Here's our development plan. We're in Sprint 1 right now — this presentation, the business plan, and the prototype you just saw. Sprint 2 in March is Phase 0, where we build the core architecture — the map system, entity framework, and base AI pipeline. Sprint 3 in April tackles the gameplay loop, the full brain system with all 5 types, and the trading mechanics. Sprint 4 in May is polish — the Director AI that manages difficulty, UI improvements, and our final presentation. For risks — the biggest one is scope creep. We're managing that by locking scope per sprint. AI complexity vs. timeline is real, and it's just the two of us."
});
const sprints = [
  { label: 'Sprint 1 — Feb', text: 'Presentation, business plan, working prototype (WSS1)', color: '2d6a4f' },
  { label: 'Sprint 2 — Mar', text: 'Phase 0: Core architecture, map system, entity framework, base AI pipeline', color: '1b4332' },
  { label: 'Sprint 3 — Apr', text: 'Full gameplay loop, all 5 brain types, trading mechanics, combat system', color: '1b4332' },
  { label: 'Sprint 4 — May', text: 'Director AI (adaptive difficulty), UI polish, final presentation', color: '1b4332' },
];
sprints.forEach((sp, i) => {
  const y = 1.2 + i * 1.1;
  s10.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 12, h: 0.9, fill: { color: i === 0 ? '2d6a4f' : CARD_BG }, rectRadius: 0.05 });
  s10.addText(sp.label, { x: 0.7, y, w: 3, h: 0.9, fontSize: 15, bold: true, color: i === 0 ? 'ffffff' : ACCENT, fontFace: 'Arial', valign: 'middle' });
  s10.addText(sp.text, { x: 3.7, y, w: 8.5, h: 0.9, fontSize: 14, color: TEXT, fontFace: 'Arial', valign: 'middle' });
});
s10.addText('Risks', { x: 0.5, y: 5.8, w: 2, h: 0.4, fontSize: 16, bold: true, color: 'ff6b6b', fontFace: 'Arial' });
s10.addText('• Scope creep — managed by locking scope per sprint\n• AI complexity vs. timeline — two-person team\n• Performance at 60 tps with multiple agents', { x: 0.5, y: 6.2, w: 12, h: 1.0, fontSize: 13, color: SUBTEXT, fontFace: 'Arial', lineSpacingMultiple: 1.3 });

// SLIDE 11 - Success Criteria
const s11 = addSlide({
  title: 'Success Criteria',
  notes: "So how do we know we've succeeded? These are our measurable milestones. A stable core loop running at 60 ticks per second — not crashing, not freezing. AI agents that you can actually watch and understand their decisions. The Vision-Brain architecture working as designed — modular, swappable, testable. All 5 brain types showing genuinely different behavior in the same environment. A functional trading system where agents negotiate with NPCs. And the big one — we already have a working Replit prototype as proof of concept. That's what you just saw in the demo."
});
const criteria = [
  { text: 'Stable core loop running at 60 ticks/second', done: false },
  { text: 'AI agents with observable, debuggable decision-making', done: false },
  { text: 'Vision-Brain architecture: modular, swappable, testable', done: false },
  { text: 'All 5 brain types showing genuinely different behavior', done: false },
  { text: 'Functional trading system with NPC merchants', done: false },
  { text: 'Working Replit prototype as proof of concept (WSS1)', done: true },
];
criteria.forEach((c, i) => {
  const y = 1.3 + i * 0.75;
  const checkColor = c.done ? '2d6a4f' : CARD_BG;
  s11.addShape(pptx.ShapeType.rect, { x: 1.5, y, w: 10, h: 0.6, fill: { color: CARD_BG }, rectRadius: 0.05 });
  s11.addText(c.done ? '✓' : '○', { x: 1.7, y, w: 0.5, h: 0.6, fontSize: 18, color: c.done ? '2d6a4f' : SUBTEXT, fontFace: 'Arial', valign: 'middle', align: 'center' });
  s11.addText(c.text, { x: 2.3, y, w: 9, h: 0.6, fontSize: 15, color: c.done ? '2d6a4f' : TEXT, fontFace: 'Arial', valign: 'middle', strike: c.done });
});

// SLIDE 12 - Closing
const s12 = pptx.addSlide();
s12.background = { color: BG };
s12.addNotes("That's WSS2 — the Wilderness Survival System. To recap: it's a real-time AI survival simulation with procedural worlds, 5 different brain strategies, a full trading economy, and a working prototype you can try right now at wss-revised.replit.app. We're Casey Wong and Raymond Julian, and we're excited to keep building this over the semester. Any questions?");
s12.addText('WSS2', { x: 0.5, y: 1.2, w: '90%', h: 1.0, fontSize: 48, bold: true, color: ACCENT, fontFace: 'Arial', align: 'center' });
s12.addText('The Wilderness Survival System', { x: 0.5, y: 2.2, w: '90%', h: 0.6, fontSize: 22, color: TEXT, fontFace: 'Arial', align: 'center' });
s12.addShape(pptx.ShapeType.rect, { x: 4.5, y: 3.0, w: 4, h: 0.04, fill: { color: ACCENT } });
const closingPoints = [
  'Real-time AI survival simulation',
  'Procedural worlds with 5 brain strategies',
  'Full trading economy',
  'Working prototype available now',
];
closingPoints.forEach((p, i) => {
  s12.addText('•  ' + p, { x: 3.5, y: 3.3 + i * 0.45, w: 6, h: 0.4, fontSize: 15, color: TEXT, fontFace: 'Arial', align: 'center' });
});
s12.addText('Demo: wss-revised.replit.app', { x: 0.5, y: 5.3, w: '90%', h: 0.5, fontSize: 16, color: ACCENT, fontFace: 'Arial', align: 'center', underline: { style: 'sng' } });
s12.addText('Casey Wong  &  Raymond Julian', { x: 0.5, y: 6.0, w: '90%', h: 0.5, fontSize: 16, bold: true, color: SUBTEXT, fontFace: 'Arial', align: 'center' });
s12.addText('Questions?', { x: 0.5, y: 6.6, w: '90%', h: 0.5, fontSize: 20, bold: true, color: TEXT, fontFace: 'Arial', align: 'center' });

pptx.writeFile({ fileName: 'WSS2_Presentation_Polished.pptx' }).then(() => {
  console.log('PowerPoint generated: WSS2_Presentation_Polished.pptx');
}).catch(err => console.error('Error:', err));
