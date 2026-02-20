import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import fs from 'fs';

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

function truncateRichText(block) {
  if (!block) return block;
  const blockType = block.type;
  if (!blockType || !block[blockType]) return block;
  const content = block[blockType];
  if (content.rich_text && Array.isArray(content.rich_text)) {
    content.rich_text = content.rich_text.map(rt => {
      if (rt.text && rt.text.content && rt.text.content.length > 2000) {
        rt.text.content = rt.text.content.substring(0, 1997) + '...';
      }
      return rt;
    });
  }
  return block;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function findPageByTitle(notion, title) {
  const r = await notion.search({ query: title, filter: { property: 'object', value: 'page' }, page_size: 20 });
  for (const p of r.results) {
    if ((p.properties?.title?.title?.[0]?.plain_text || '') === title) return p.id;
  }
  return null;
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

const mode = process.argv[2];
const docTitle = process.argv[3];
const docFile = process.argv[4];

async function run() {
  const notion = await getNotionClient();

  if (mode === 'update') {
    console.log(`Updating: ${docTitle}...`);
    const pageId = await findPageByTitle(notion, docTitle);
    if (!pageId) { console.log(`Page not found: ${docTitle}`); return; }
    const md = fs.readFileSync(docFile, 'utf-8');
    let blocks;
    try { blocks = markdownToBlocks(md); }
    catch { blocks = md.split('\n').filter(l => l.trim()).map(l => ({ type: 'paragraph', paragraph: { rich_text: [{ text: { content: l } }] } })); }
    blocks = blocks.map(truncateRichText);
    console.log(`  Clearing...`);
    await clearPage(notion, pageId);
    console.log(`  Writing ${blocks.length} blocks...`);
    await appendBlocks(notion, pageId, blocks);
    console.log(`  Done!`);
  }

  if (mode === 'questions') {
    console.log('Creating/updating questions page...');
    const r = await notion.search({ filter: { property: 'object', value: 'page' }, page_size: 20 });
    let parentId = null;
    for (const p of r.results) {
      const t = p.properties?.title?.title?.[0]?.plain_text || '';
      if (t.toLowerCase().includes('forgotten place') || t.toLowerCase().includes('wss2') || t.toLowerCase().includes('game design')) {
        parentId = p.id; break;
      }
    }
    if (!parentId) { console.log('No parent page found'); return; }

    const qTitle = 'Open Questions — Need Your Input';
    const existingId = await findPageByTitle(notion, qTitle);

    const blocks = [
      { type: 'callout', callout: { icon: { emoji: '❓' }, rich_text: [{ text: { content: 'Two design questions need your answer before we can fully lock in loot distribution and brain tick rate.' } }] } },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Question 1: Loot Bias Model' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'How strongly should distance from spawn vs. difficulty level drive loot quality? Pick one:' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '(A) Stepped Tiers — Each difficulty/map tier has a base loot quality range (Easy = mostly low, Hard = mostly mid/high), plus a mild bonus the farther from spawn you go.' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '(B) Strong Distance Gradient — Near spawn is mostly junk; high-end loot only far from spawn or in special POIs (labs, bunkers), regardless of difficulty.' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: '(C) Difficulty-Driven, Distance as Flavor — Difficulty level does most of the work; distance from spawn only nudges things a bit.' } }] } },
      { type: 'divider', divider: {} },
      { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Question 2: Brain Tick Rate Default for v0.1' } }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'What should the starting default be for how often AI brains make decisions?' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Option 1: Start at EVERY TICK (60 decisions/sec) by default. Include a debug toggle to slow down to every 5 ticks if performance is bad.' } }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Option 2: Start at EVERY 5 TICKS (12 decisions/sec) by default. Only speed up to every-tick after profiling confirms it runs smoothly.' } }] } },
      { type: 'divider', divider: {} },
      { type: 'callout', callout: { icon: { emoji: '✅' }, rich_text: [{ text: { content: 'Reply with your choices (e.g., "A and Option 1") and I\'ll lock them into the design docs!' } }] } }
    ];

    if (existingId) {
      await clearPage(notion, existingId);
      await appendBlocks(notion, existingId, blocks);
      console.log('Updated existing questions page.');
    } else {
      const page = await notion.pages.create({
        parent: { page_id: parentId },
        icon: { emoji: '❓' },
        properties: { title: { title: [{ text: { content: qTitle } }] } },
        children: []
      });
      await appendBlocks(notion, page.id, blocks);
      console.log(`Created questions page: ${page.id}`);
    }
    console.log('Done!');
  }
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
