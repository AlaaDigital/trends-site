const fs = require('fs');
const path = require('path');

const ROOT = '.';
const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== '404.html');

console.log(`Found ${files.length} HTML files:`, files);

const trends = [];

for (const file of files) {
  if (file === 'index.html') continue;
  try {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    const ogImageMatch = content.match(/<meta property="og:image" content="(.*?)"/i);
    const descMatch = content.match(/<meta name="description" content="(.*?)"/i);
    
    let title = titleMatch ? titleMatch[1].replace(' - trends.afdalbot.com','').trim() : file.replace('.html','').replace(/-/g,' ');
    let image = ogImageMatch ? ogImageMatch[1] : `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600`;
    let desc = descMatch ? descMatch[1] : title;
    
    trends.push({
      file: `/${file}`,
      title: title.substring(0, 80),
      image: image,
      description: desc.substring(0, 150),
      date: new Date().toISOString().split('T')[0]
    });
  } catch(e) {
    console.log(`Skip ${file}:`, e.message);
  }
}

fs.writeFileSync('_trends.json', JSON.stringify(trends, null, 2));
console.log('_trends.json generated with', trends.length, 'trends');

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://trends.afdalbot.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
`;

for (const t of trends) {
  sitemap += `  <url>
    <loc>https://trends.afdalbot.com${t.file}</loc>
    <lastmod>${t.date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
}

sitemap += `</urlset>`;
fs.writeFileSync('sitemap.xml', sitemap);
console.log('sitemap.xml generated with', trends.length, 'urls');
