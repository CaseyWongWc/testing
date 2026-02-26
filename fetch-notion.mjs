import { Client } from '@notionhq/client';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;
  if (!xReplitToken) throw new Error('X-Replit-Token not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    { headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!accessToken) throw new Error('Notion not connected');
  return accessToken;
}

async function main() {
  const token = await getAccessToken();
  const notion = new Client({ auth: token });
  
  const pageId = "3120e51f-71de-801b-9501-cf349b8a6432";
  
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = page.properties?.title?.title?.[0]?.plain_text || "untitled";
  console.log("Title:", title);
  console.log("Parent:", JSON.stringify(page.parent));
  console.log("Icon:", JSON.stringify(page.icon));
  console.log("Cover:", JSON.stringify(page.cover));
  console.log();

  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
  
  for (const block of blocks.results) {
    const type = block.type;
    let text = "";
    
    if (block[type]?.rich_text) {
      text = block[type].rich_text.map(t => t.plain_text).join("");
    } else if (type === "child_page") {
      text = block.child_page?.title || "";
    } else if (type === "embed") {
      text = block.embed?.url || "";
    } else if (type === "bookmark") {
      text = block.bookmark?.url || "";
    } else if (type === "image") {
      text = block.image?.file?.url || block.image?.external?.url || "(image)";
    }
    
    console.log(`[${type}] ${text}`);
  }

  // Check for child pages
  const children = blocks.results.filter(b => b.type === "child_page");
  if (children.length > 0) {
    console.log("\n--- Child Pages ---");
    for (const child of children) {
      console.log(child.id + " | " + child.child_page.title);
    }
  }
}

main().catch(e => console.error(e));
