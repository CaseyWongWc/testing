import { Client } from '@notionhq/client';

let connectionSettings = null;

async function getAccessToken() {
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
  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

async function run() {
  const notion = new Client({ auth: await getAccessToken() });
  
  // Find all pages
  const allPages = [];
  let cursor = undefined;
  while (true) {
    const r = await notion.search({ filter: { property: 'object', value: 'page' }, page_size: 100, start_cursor: cursor });
    allPages.push(...r.results);
    if (!r.has_more) break;
    cursor = r.next_cursor;
  }
  
  console.log(`\n=== ALL NOTION PAGES (${allPages.length} total) ===\n`);
  for (const page of allPages) {
    const title = page.properties?.title?.title?.[0]?.plain_text || '(untitled)';
    const parentType = page.parent?.type;
    const parentId = page.parent?.page_id || page.parent?.database_id || page.parent?.workspace || '';
    const lastEdited = page.last_edited_time;
    const icon = page.icon?.emoji || '';
    console.log(`${icon} "${title}"`);
    console.log(`   ID: ${page.id}`);
    console.log(`   Parent: ${parentType} = ${parentId}`);
    console.log(`   Last edited: ${lastEdited}`);
    
    // Get block count
    try {
      const blocks = await notion.blocks.children.list({ block_id: page.id, page_size: 1 });
      // Just check if it has content
      const hasContent = blocks.results.length > 0;
      console.log(`   Has content: ${hasContent}`);
    } catch (e) {
      console.log(`   Content check failed: ${e.message?.substring(0, 60)}`);
    }
    console.log('');
  }
}

run().catch(err => { console.error('Error:', err.message); process.exit(1); });
