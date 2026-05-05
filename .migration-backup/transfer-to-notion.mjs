import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';
import fs from 'fs';
import path from 'path';

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

const DOCS = [
  { file: 'wss(full game ideas)/ROADMAP.md', title: 'ROADMAP — Development Phases', icon: '🗺️' },
  { file: 'wss(full game ideas)/systems/combat.md', title: 'Combat System', icon: '⚔️' },
  { file: 'wss(full game ideas)/systems/spawners-and-enemies.md', title: 'Spawners & Enemies', icon: '👾' },
  { file: 'wss(full game ideas)/systems/ai-brains.md', title: 'AI Brains', icon: '🧠' },
  { file: 'wss(full game ideas)/systems/fog-and-vision.md', title: 'Fog & Vision', icon: '👁️' },
  { file: 'wss(full game ideas)/systems/map-generation.md', title: 'Map Generation', icon: '🌍' },
  { file: 'wss(full game ideas)/systems/object-model.md', title: 'Object Model (OOP)', icon: '🏗️' },
  { file: 'wss(full game ideas)/systems/resources-and-economy.md', title: 'Resources & Economy', icon: '💰' },
  { file: 'wss(full game ideas)/systems/core-loop.md', title: 'Core Game Loop', icon: '🔄' },
  { file: 'wss(full game ideas)/systems/day-night-cycle.md', title: 'Day/Night Cycle', icon: '🌙' },
  { file: 'wss(full game ideas)/systems/win-conditions.md', title: 'Win Conditions', icon: '🏆' },
  { file: 'wss(full game ideas)/WSS -ideas.md', title: 'WSS Ideas (Brainstorm Notes)', icon: '💡' },
];

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
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

async function run() {
  const notion = await getNotionClient();

  console.log('Searching for available Notion pages...');
  const searchResult = await notion.search({
    filter: { property: 'object', value: 'page' },
    page_size: 10
  });

  let parentPageId = null;
  
  for (const page of searchResult.results) {
    const title = page.properties?.title?.title?.[0]?.plain_text || '';
    console.log(`  Found page: "${title}" (${page.id})`);
    if (title.toLowerCase().includes('forgotten place') || title.toLowerCase().includes('wss2') || title.toLowerCase().includes('wss')) {
      parentPageId = page.id;
      console.log(`  -> Using existing parent page: "${title}"`);
      break;
    }
  }

  if (!parentPageId) {
    console.log('No existing WSS page found. Creating parent page...');
    
    let firstPageId = null;
    if (searchResult.results.length > 0) {
      firstPageId = searchResult.results[0].id;
    }

    const parentProps = {
      properties: {
        title: {
          title: [{ text: { content: 'A Forgotten Place (WSS2) — Game Design' } }]
        }
      },
      icon: { emoji: '🧟' },
      children: [
        {
          type: 'callout',
          callout: {
            icon: { emoji: '📋' },
            rich_text: [{ text: { content: 'Zero-player survival horror game design documents. Each sub-page covers a different system.' } }]
          }
        }
      ]
    };

    if (firstPageId) {
      parentProps.parent = { page_id: firstPageId };
    } else {
      const dbSearch = await notion.search({
        filter: { property: 'object', value: 'database' },
        page_size: 5
      });
      if (dbSearch.results.length > 0) {
        parentProps.parent = { database_id: dbSearch.results[0].id };
      } else {
        console.error('No pages or databases found in Notion workspace. Cannot create parent page.');
        console.error('Please create a page in Notion first and share it with the integration.');
        process.exit(1);
      }
    }

    const parentPage = await notion.pages.create(parentProps);
    parentPageId = parentPage.id;
    console.log(`Created parent page: ${parentPageId}`);
  }

  for (const doc of DOCS) {
    console.log(`\nProcessing: ${doc.title}...`);
    
    if (!fs.existsSync(doc.file)) {
      console.log(`  Skipping (file not found): ${doc.file}`);
      continue;
    }

    const markdown = fs.readFileSync(doc.file, 'utf-8');
    
    let blocks;
    try {
      blocks = markdownToBlocks(markdown);
    } catch (e) {
      console.log(`  Warning: markdown conversion issue for ${doc.title}, using plain text fallback`);
      const lines = markdown.split('\n');
      blocks = [];
      for (const line of lines) {
        if (line.startsWith('# ')) {
          blocks.push({
            type: 'heading_1',
            heading_1: { rich_text: [{ text: { content: line.replace(/^# /, '') } }] }
          });
        } else if (line.startsWith('## ')) {
          blocks.push({
            type: 'heading_2',
            heading_2: { rich_text: [{ text: { content: line.replace(/^## /, '') } }] }
          });
        } else if (line.startsWith('### ')) {
          blocks.push({
            type: 'heading_3',
            heading_3: { rich_text: [{ text: { content: line.replace(/^### /, '') } }] }
          });
        } else if (line.trim() === '---') {
          blocks.push({ type: 'divider', divider: {} });
        } else if (line.startsWith('- ')) {
          blocks.push({
            type: 'bulleted_list_item',
            bulleted_list_item: { rich_text: [{ text: { content: line.replace(/^- /, '') } }] }
          });
        } else if (line.trim() !== '') {
          blocks.push({
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: line } }] }
          });
        }
      }
    }

    blocks = blocks.map(truncateRichText);

    const page = await notion.pages.create({
      parent: { page_id: parentPageId },
      icon: { emoji: doc.icon },
      properties: {
        title: {
          title: [{ text: { content: doc.title } }]
        }
      },
      children: []
    });

    console.log(`  Created page: ${doc.title} (${page.id})`);

    const chunks = chunkArray(blocks, 100);
    for (let i = 0; i < chunks.length; i++) {
      try {
        await notion.blocks.children.append({
          block_id: page.id,
          children: chunks[i]
        });
        console.log(`  Appended block chunk ${i + 1}/${chunks.length} (${chunks[i].length} blocks)`);
      } catch (e) {
        console.error(`  Error appending chunk ${i + 1}: ${e.message}`);
        for (const block of chunks[i]) {
          try {
            await notion.blocks.children.append({
              block_id: page.id,
              children: [block]
            });
          } catch (innerErr) {
            console.error(`    Skipped block (${block.type}): ${innerErr.message?.substring(0, 100)}`);
          }
        }
      }
    }
    
    console.log(`  Done: ${doc.title}`);
  }

  console.log('\n✅ All documents transferred to Notion!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
