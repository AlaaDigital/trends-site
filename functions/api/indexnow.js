
/**
 * Bing Webmaster Guidelines Compliant IndexNow
 * Guideline #4: Avoid batch, use streaming submissions
 * Guideline #21: Reduce crawl waste
 * Guideline #3: Use accurate sitemap signals + lastmod
 */

export async function onRequest(context) {
  const REPO = 'AlaaDigital/trends-site';
  const BRANCH = 'main';
  const DOMAIN = 'trends.afdalbot.com';
  const INDEXNOW_KEY = '161c2d819a244a699639cc876148b31d';
  const requestUrl = new URL(context.request.url);
  
  // Guideline #4: Streaming submission - notify Bing quickly when URL changes
  // Use ?url=https://... for single URL (RECOMMENDED per guidelines)
  const singleUrl = requestUrl.searchParams.get('url');
  const isBatchAllowed = requestUrl.searchParams.get('batch') === 'true';
  
  let urls = [];
  let mode = 'streaming';

  try {
    if (singleUrl) {
      // VALIDATE: Ensure URL belongs to our domain (Guideline #6 - Consolidate duplicate URLs)
      try {
        const parsed = new URL(singleUrl);
        if (parsed.hostname !== DOMAIN && parsed.hostname !== `www.${DOMAIN}`) {
          throw new Error('URL must belong to ' + DOMAIN);
        }
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid URL: ' + e.message, guideline: 'Guideline #6 - canonical URLs only' }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      urls = [singleUrl];
      mode = 'streaming-single';
    } else if (isBatchAllowed) {
      // Batch only when explicitly requested - Guideline #21: Avoid excessive low-value URLs
      const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=${BRANCH}&t=${Date.now()}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'trends-bot-bing-compliant' }
      });
      if (!apiRes.ok) throw new Error('GitHub API failed ' + apiRes.status);
      const files = await apiRes.json();
      const htmlFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html') && !['404.html'].includes(f.name.toLowerCase())).map(f => f.name);
      const recentFiles = htmlFiles.slice(-20);
      urls = recentFiles.map(name => {
        if (name.toLowerCase() === 'index.html') return `https://${DOMAIN}/`;
        return `https://${DOMAIN}/${name}`;
      });
      mode = 'batch-limited-20';
    } else {
      // Default: Auto-detect latest file only - TRUE streaming per Guideline #4
      const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=${BRANCH}&t=${Date.now()}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'trends-bot-bing-compliant' }
      });
      if (!apiRes.ok) throw new Error('GitHub API failed ' + apiRes.status);
      const files = await apiRes.json();
      const htmlFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html') && !['404.html','index.html'].includes(f.name.toLowerCase())).map(f => f.name);
      if (htmlFiles.length > 0) {
        const latest = htmlFiles[htmlFiles.length - 1];
        urls = [`https://${DOMAIN}/${latest}`];
        mode = 'streaming-auto-latest';
      } else {
        urls = [`https://${DOMAIN}/`];
        mode = 'streaming-home';
      }
    }

    const payload = {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `https://${DOMAIN}/${INDEXNOW_KEY}.txt`,
      urlList: urls
    };

    const [res1, res2] = await Promise.all([
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      }),
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      })
    ]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Bing Guidelines Compliant - Streaming submission',
      guideline_ref: 'Guideline #4: Notify Bing quickly when URLs Change - streaming provides faster updates, reduce server load',
      mode: mode,
      key: INDEXNOW_KEY,
      submitted: urls.length,
      urls: urls,
      indexnow_status: res1.status,
      bing_status: res2.status,
      next_steps: 'Now click Request Indexing in Bing Webmaster Tools',
      usage: {
        streaming_single: `https://${DOMAIN}/api/indexnow?url=https://${DOMAIN}/your-new-page.html`,
        streaming_auto: `https://${DOMAIN}/api/indexnow`,
        batch_limited: `https://${DOMAIN}/api/indexnow?batch=true`
      }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestGet(context) {
  return onRequest(context);
}
export async function onRequestPost(context) {
  return onRequest(context);
}
