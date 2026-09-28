export async function onRequestGet(context) {
  const REPO = 'AlaaDigital/trends-site';
  const BRANCH = 'main';
  const DOMAIN = 'trends.afdalbot.com';
  const INDEXNOW_KEY = '161c2d819a244a699639cc876148b31d'; 

  try {
    const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=${BRANCH}&t=${Date.now()}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'trends-bot' }
    });
    if (!apiRes.ok) throw new Error('GitHub API failed');
    const files = await apiRes.json();
    const htmlFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html') && !['404.html'].includes(f.name.toLowerCase())).map(f => f.name);
    
    const urls = htmlFiles.map(name => {
      if (name.toLowerCase() === 'index.html') return `https://${DOMAIN}/`;
      return `https://${DOMAIN}/${name}`;
    });

    const payload = {
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `https://${DOMAIN}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(0, 10000)
    };

    const res1 = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res2 = await fetch('https://www.bing.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'تمت الأرشفة اللحظية!',
      key: INDEXNOW_KEY,
      submitted: urls.length,
      urls: urls,
      indexnow_status: res1.status,
      bing_status: res2.status
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
