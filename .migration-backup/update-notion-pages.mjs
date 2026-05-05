import { Client } from '@notionhq/client';

let connectionSettings = null;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('Notion not connected');
  return accessToken;
}

async function getNotionClient() {
  return new Client({ auth: await getAccessToken() });
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function clearPage(notion, pageId) {
  let hasMore = true;
  while (hasMore) {
    const children = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
    if (children.results.length === 0) break;
    await Promise.all(children.results.map(b => notion.blocks.delete({ block_id: b.id }).catch(() => {})));
    hasMore = children.has_more;
  }
}

async function appendBlocks(notion, pageId, blocks) {
  for (const chunk of chunkArray(blocks, 100)) {
    try {
      await notion.blocks.children.append({ block_id: pageId, children: chunk });
    } catch (e) {
      for (const block of chunk) {
        try { await notion.blocks.children.append({ block_id: pageId, children: [block] }); }
        catch (ie) { console.error(`    Skip: ${ie.message?.substring(0, 80)}`); }
      }
    }
  }
}

async function updateOpenQuestions(notion) {
  const pageId = '30d0e51f-71de-8189-a5d0-f5b33a061398';
  console.log('Updating Open Questions page...');

  await clearPage(notion, pageId);

  const blocks = [
    { type: 'callout', callout: { icon: { emoji: '❓' }, rich_text: [{ text: { content: 'One remaining design question needs your answer before we can fully lock in brain tick rate.' } }] } },
    { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Question 2: Brain Tick Rate Default for v0.1' } }] } },
    { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'What should the starting default be for how often AI brains make decisions?' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Option 1: Start at EVERY TICK (60 decisions/sec) by default. Include a debug toggle to slow down to every 5 ticks if performance is bad.' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Option 2: Start at EVERY 5 TICKS (12 decisions/sec) by default. Only speed up to every-tick after profiling confirms it runs smoothly.' } }] } },
    { type: 'divider', divider: {} },
    { type: 'callout', callout: { icon: { emoji: '✅' }, rich_text: [{ text: { content: 'Reply with your choice (e.g., "Option 1") and I\'ll lock it into the design docs!' } }] } },
    { type: 'divider', divider: {} },
    { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Resolved Questions' } }] } },
    { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Loot Bias Model — LOCKED as C+A Hybrid (difficulty-driven base + distance nudge). See Map Generation page.' } }] } },
  ];

  await appendBlocks(notion, pageId, blocks);
  console.log('  Open Questions page updated!');
}

async function updateMapGeneration(notion) {
  const pageId = '30c0e51f-71de-8119-a57a-ca20475cebc1';
  console.log('Updating Map Generation page...');

  const blocks = [
    { type: 'divider', divider: {} },
    { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Loot Distribution Details (LOCKED)' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Loot Bias Model: C+A Hybrid — difficulty level drives loot quality (Option C), with a mild distance-from-spawn nudge (Option A). Distance modifier is removable for other game modes.' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Loot Density: More loot indoors than outdoors. Buildings have containers + scattered floor items. Outside has sparser ground items.' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Themed Containers: Building type determines loot category (hospital = medical, military = weapons/ammo, police station = pistols/armor, gas station = food/utility, residential = mixed low-tier).' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Enemy Drops: Human enemies drop equipped gear on death — weapons, ammo, armor, food/water, currency, clothes, backpacks (1 backpack limit per survivor).' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Loot Respawn: ON by default (togglable). Container loot is one-time. Respawns appear as new ground items or new containers.' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Friendly Fire: ON — full damage to allies.' } }] } },
  ];

  await appendBlocks(notion, pageId, blocks);
  console.log('  Map Generation page updated!');
}

async function updateResourcesEconomy(notion) {
  const pageId = '30c0e51f-71de-81da-ad8d-eebce614bbac';
  console.log('Updating Resources & Economy page...');

  const blocks = [
    { type: 'divider', divider: {} },
    { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Loot Distribution (LOCKED)' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Pre-placed loot: clustered in buildings (loot sockets + floor scatter) + random outdoor scatter (density slider per terrain type)' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Enemy drops: human enemies drop weapons, ammo, armor, food/water, currency, clothes, backpacks (1 per survivor)' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'No rarity tier labels — quality driven by difficulty, not common/rare/legendary' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Loot bias: C+A hybrid — difficulty-driven quality with mild distance nudge' } }] } },
    { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Loot respawn ON by default (togglable); container loot one-time, respawns as new ground items' } }] } },
  ];

  await appendBlocks(notion, pageId, blocks);
  console.log('  Resources & Economy page updated!');
}

async function run() {
  const notion = await getNotionClient();
  await updateOpenQuestions(notion);
  await updateMapGeneration(notion);
  await updateResourcesEconomy(notion);
  console.log('\nAll pages updated successfully!');
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
