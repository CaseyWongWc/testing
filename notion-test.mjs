import { Client } from '@notionhq/client';

let connectionSettings;

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

async function main() {
  try {
    const notion = await getNotionClient();
    
    // First, search for existing pages to find a parent page or database
    console.log("Searching for pages in your Notion workspace...");
    const searchResults = await notion.search({
      query: "WSS",
      page_size: 10
    });
    
    console.log(`Found ${searchResults.results.length} results for "WSS":`);
    for (const result of searchResults.results) {
      const title = result.properties?.title?.title?.[0]?.plain_text 
        || result.properties?.Name?.title?.[0]?.plain_text
        || result.properties?.title?.rich_text?.[0]?.plain_text
        || "(untitled)";
      console.log(`  - [${result.object}] ${title} (id: ${result.id})`);
    }

    // Also search more broadly
    const allResults = await notion.search({
      page_size: 20
    });
    
    console.log(`\nAll accessible pages/databases (${allResults.results.length}):`);
    for (const result of allResults.results) {
      let title = "(untitled)";
      if (result.object === 'page') {
        const titleProp = result.properties?.title || result.properties?.Name;
        if (titleProp?.title?.[0]?.plain_text) {
          title = titleProp.title[0].plain_text;
        }
      } else if (result.object === 'database') {
        title = result.title?.[0]?.plain_text || "(untitled db)";
      }
      console.log(`  - [${result.object}] "${title}" (id: ${result.id})`);
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
