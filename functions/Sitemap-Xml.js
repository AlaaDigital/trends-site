export async function onRequest(context) {
  const REPO = 'AlaaDigital/trends-site';
  const base = 'https://trends.afdalbot.com';
  try {
    // Fetch file list from GitHub API
    const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=main`, {
      headers: { 'User-Agent': 'Cloudflare-Worker' }
    });
    let htmlFiles = [];
    if (apiRes.ok) {
      const files = await apiRes.json();
      htmlFiles = files.filter(f => f.name.endsWith('.html') && f.name !== '404.html' && f.name !== 'index.html');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`;

    for (const file of htmlFiles) {
      xml += `
  <url>
    <loc>${base}/${file.name}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    // Fallback minimal sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${'https://trends.afdalbot.com/'}</loc></url>
</urlset>`;
    return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
  }
}
