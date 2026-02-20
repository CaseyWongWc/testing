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

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Notion not connected');
  }
  return accessToken;
}

async function getNotionClient() {
  const accessToken = await getAccessToken();
  return new Client({ auth: accessToken });
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
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function findPageByTitle(notion, title) {
  const searchResult = await notion.search({
    query: title,
    filter: { property: 'object', value: 'page' },
    page_size: 20
  });

  for (const page of searchResult.results) {
    const pageTitle = page.properties?.title?.title?.[0]?.plain_text || '';
    if (pageTitle === title) {
      return page.id;
    }
  }
  return null;
}

async function clearPageContent(notion, pageId) {
  const children = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  for (const block of children.results) {
    try {
      await notion.blocks.delete({ block_id: block.id });
    } catch (e) {
      console.log(`  Warning: could not delete block ${block.id}: ${e.message}`);
    }
  }
}

async function appendBlocks(notion, pageId, blocks) {
  const chunks = chunkArray(blocks, 100);
  for (let i = 0; i < chunks.length; i++) {
    try {
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunks[i]
      });
      console.log(`  Appended chunk ${i + 1}/${chunks.length} (${chunks[i].length} blocks)`);
    } catch (e) {
      console.error(`  Error appending chunk ${i + 1}: ${e.message}`);
      for (const block of chunks[i]) {
        try {
          await notion.blocks.children.append({
            block_id: pageId,
            children: [block]
          });
        } catch (innerErr) {
          console.error(`    Skipped block (${block.type}): ${innerErr.message?.substring(0, 100)}`);
        }
      }
    }
  }
}

const DOCS_TO_UPDATE = [
  { file: 'wss(full game ideas)/systems/ai-brains.md', title: 'AI Brains' },
  { file: 'wss(full game ideas)/systems/combat.md', title: 'Combat System' },
  { file: 'wss(full game ideas)/systems/map-generation.md', title: 'Map Generation' },
  { file: 'wss(full game ideas)/systems/resources-and-economy.md', title: 'Resources & Economy' },
];

async function run() {
  const notion = await getNotionClient();
  console.log('Connected to Notion.\n');

  for (const doc of DOCS_TO_UPDATE) {
    console.log(`Updating: ${doc.title}...`);
    
    const pageId = await findPageByTitle(notion, doc.title);
    if (!pageId) {
      console.log(`  Page "${doc.title}" not found in Notion. Skipping.`);
      continue;
    }
    console.log(`  Found page: ${pageId}`);

    const markdown = fs.readFileSync(doc.file, 'utf-8');
    let blocks;
    try {
      blocks = markdownToBlocks(markdown);
    } catch (e) {
      console.log(`  Warning: markdown conversion issue, using plain text fallback`);
      blocks = markdown.split('\n').filter(l => l.trim()).map(line => ({
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: line } }] }
      }));
    }
    blocks = blocks.map(truncateRichText);

    console.log(`  Clearing old content...`);
    await clearPageContent(notion, pageId);

    console.log(`  Writing ${blocks.length} blocks...`);
    await appendBlocks(notion, pageId, blocks);
    console.log(`  Done: ${doc.title}\n`);
  }

  console.log('--- Adding Open Questions Page ---\n');

  let parentPageId = null;
  const searchResult = await notion.search({
    filter: { property: 'object', value: 'page' },
    page_size: 20
  });
  for (const page of searchResult.results) {
    const title = page.properties?.title?.title?.[0]?.plain_text || '';
    if (title.toLowerCase().includes('forgotten place') || title.toLowerCase().includes('wss2') || title.toLowerCase().includes('game design')) {
      parentPageId = page.id;
      console.log(`Found parent page: "${title}"`);
      break;
    }
  }

  if (!parentPageId) {
    console.log('Could not find parent page. Skipping questions page.');
  } else {
    const questionsTitle = 'Open Questions — Need Your Input';
    const existingQPage = await findPageByTitle(notion, questionsTitle);
    
    const questionBlocks = [
      {
        type: 'callout',
        callout: {
          icon: { emoji: '❓' },
          rich_text: [{ text: { content: 'Two design questions need your answer before we can fully lock in loot distribution and brain tick rate.' } }]
        }
      },
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: 'Question 1: Loot Bias Model' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'How strongly should distance from spawn vs. difficulty level drive loot quality? Pick one:' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '(A) Stepped Tiers — Each difficulty/map tier has a base loot quality range (Easy: mostly low, Hard: mostly mid/high), plus a mild bonus the farther from spawn you go.' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '(B) Strong Distance Gradient — Near spawn is mostly junk; high-end loot is almost only far from spawn or in special POIs (labs, bunkers, etc.), regardless of difficulty.' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: '(C) Difficulty-Driven, Distance as Flavor — Difficulty level does most of the work; distance from spawn only nudges things a bit.' } }] }
      },
      { type: 'divider', divider: {} },
      {
        type: 'heading_2',
        heading_2: { rich_text: [{ text: { content: 'Question 2: Brain Tick Rate Default for v0.1' } }] }
      },
      {
        type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'What should the starting default be for how often AI brains make decisions?' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'Option 1: Start at EVERY TICK (60 decisions/sec) by default. Include a debug toggle to slow down to every 5 ticks if performance is bad.' } }] }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ text: { content: 'Option 2: Start at EVERY 5 TICKS (12 decisions/sec) by default. Only speed up to every-tick after profiling confirms it runs smoothly.' } }] }
      },
      { type: 'divider', divider: {} },
      {
        type: 'callout',
        callout: {
          icon: { emoji: '✅' },
          rich_text: [{ text: { content: 'Reply with your choices (e.g., "A and Option 1") and I\'ll lock them into the design docs!' } }]
        }
      }
    ];

    if (existingQPage) {
      console.log(`Found existing questions page. Updating...`);
      await clearPageContent(notion, existingQPage);
      await appendBlocks(notion, existingQPage, questionBlocks);
      console.log('Updated questions page.');
    } else {
      const page = await notion.pages.create({
        parent: { page_id: parentPageId },
        icon: { emoji: '❓' },
        properties: {
          title: { title: [{ text: { content: questionsTitle } }] }
        },
        children: []
      });
      await appendBlocks(notion, page.id, questionBlocks);
      console.log(`Created questions page: ${page.id}`);
    }
  }

  console.log('\n✅ All updates pushed to Notion!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
