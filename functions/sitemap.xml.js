export async function onRequest(context) {
  const REPO = 'AlaaDigital/trends-site';
  const BRANCH = 'main';
  const DOMAIN = 'https://trends.afdalbot.com';
  const FALLBACK_FILES = [
    'chlorthalidone-tablets-fda-recall.html',
    'strait-of-hormuz-oil-flow-rebound.html'
  ];
  
  try {
    const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=${BRANCH}&t=${Date.now()}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'trends-bot-sitemap' }
    });
    
    let htmlFiles = [];
    if (apiRes.ok) {
      const files = await apiRes.json();
      htmlFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html') && !['404.html'].includes(f.name.toLowerCase()));
    } else {
      // Fallback when GitHub API rate-limited
      htmlFiles = FALLBACK_FILES.map(name => ({ name }));
    }
    
    if (htmlFiles.length === 0) {
      htmlFiles = FALLBACK_FILES.map(name => ({ name }));
    }
    
    const now = new Date().toISOString().split('T')[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
    for (const file of htmlFiles) {
      const isIndex = file.name.toLowerCase() === 'index.html';
      const loc = isIndex ? `${DOMAIN}/` : `${DOMAIN}/${file.name}`;
      const priority = isIndex ? '1.0' : '0.9';
      const changefreq = isIndex ? 'hourly' : 'daily';
      xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
    }
    xml += `</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    // Even on error, return fallback with known files
    const now = new Date().toISOString().split('T')[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
    xml += `  <url><loc>${DOMAIN}/</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>
`;
    for (const name of FALLBACK_FILES) {
      xml += `  <url><loc>${DOMAIN}/${name}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
`;
    }
    xml += `</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  }
}
