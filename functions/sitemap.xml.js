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
      htmlFiles = FALLBACK_FILES.map(name => ({ name }));
    }
    
    if (htmlFiles.length === 0) {
      htmlFiles = FALLBACK_FILES.map(name => ({ name }));
    }
    
    const now = new Date().toISOString().split('T')[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const file of htmlFiles) {
      const isIndex = file.name.toLowerCase() === 'index.html';
      // FIXED: Output clean URLs without .html to match canonical and avoid redirect issues
      const cleanName = file.name.replace(/\.html$/i, '');
      const loc = isIndex ? `${DOMAIN}/` : `${DOMAIN}/${cleanName}`;
      const priority = isIndex ? '1.0' : '0.9';
      const changefreq = isIndex ? 'hourly' : 'daily';
      xml += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) {
    const now = new Date().toISOString().split('T')[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${DOMAIN}/</loc><lastmod>${now}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
    for (const name of FALLBACK_FILES) {
      const cleanName = name.replace(/\.html$/i, '');
      xml += `  <url><loc>${DOMAIN}/${cleanName}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n`;
    }
    xml += `</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  }
}
