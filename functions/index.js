/**
 * Bing Webmaster Guidelines Compliant IndexNow - FIXED
 * Guideline #4: Avoid batch, use streaming submissions
 * Guideline #21: Reduce crawl waste
 */

export async function onRequest(context) {
  const REPO = 'AlaaDigital/trends-site';
  const BRANCH = 'main';
  const DOMAIN = 'trends.afdalbot.com';
  const INDEXNOW_KEY = '161c2d819a244a699639cc876148b31d';
  const requestUrl = new URL(context.request.url);
  
  const singleUrl = requestUrl.searchParams.get('url');
  const isBatchAllowed = requestUrl.searchParams.get('batch') === 'true';
  
  let urls = [];
  let mode = 'streaming';

  try {
    if (singleUrl) {
      try {
        const parsed = new URL(singleUrl);
        if (parsed.hostname !== DOMAIN && parsed.hostname !== `www.${DOMAIN}`) {
          throw new Error('URL must belong to ' + DOMAIN);
        }
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid URL: ' + e.message }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
      }
      urls = [singleUrl];
      mode = 'streaming-single';
    } else if (isBatchAllowed) {
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
      message: 'Bing Guidelines Compliant - Streaming',
      mode: mode,
      key: INDEXNOW_KEY,
      submitted: urls.length,
      urls: urls,
      indexnow_status: res1.status,
      bing_status: res2.status,
      usage: {
        single: `https://${DOMAIN}/api/indexnow?url=https://${DOMAIN}/your-page.html`
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
