/**
 * Bing Webmaster Guidelines Fix - Homepage with crawlable internal links
 * Guideline #2: Make URLs Easy to Discover
 * Guideline #5: Use Links to Establish Structure - crawlable <a href>
 * Guideline #8: Allow Efficient Crawling - avoid hiding content behind client-side rendering
 */

export async function onRequest(context) {
  const REPO = 'AlaaDigital/trends-site';
  const BRANCH = 'main';
  
  let htmlFiles = [];
  let trends = [];
  
  try {
    const apiRes = await fetch(`https://api.github.com/repos/${REPO}/contents?ref=${BRANCH}&t=${Date.now()}`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'trends-bot-homepage' }
    });
    if (apiRes.ok) {
      const files = await apiRes.json();
      htmlFiles = files.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.html') && !['index.html','404.html'].includes(f.name.toLowerCase())).map(f => f.name);
      
      const toFetch = htmlFiles.slice(-12).reverse();
      for (const name of toFetch) {
        try {
          const raw = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${encodeURIComponent(name)}?t=${Date.now()}`).then(r => r.text());
          const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
          let title = titleMatch ? titleMatch[1].replace(/\s*-\s*trends\.afdalbot.*/i,'').trim() : name.replace('.html','').replace(/-/g,' ');
          const descMatch = raw.match(/<meta name="description" content="([^"]+)"/i) || raw.match(/<meta property="og:description" content="([^"]+)"/i);
          let desc = descMatch ? descMatch[1].substring(0,130) : title.substring(0,130);
          const imgMatch = raw.match(/<meta property="og:image" content="([^"]+)"/i);
          let image = imgMatch ? imgMatch[1] : `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80&auto=format&fit=crop`;
          
          const lower = (title + name).toLowerCase();
          let cat = 'TRENDING';
          if (lower.includes('iphone') || lower.includes('apple')) cat = 'IPHONE';
          else if (lower.includes('chatgpt') || lower.includes('ai') || lower.includes('gemini')) cat = 'AI';
          else if (lower.includes('tech') || lower.includes('leak')) cat = 'TECH';
          else if (lower.includes('viral') || lower.includes('tiktok')) cat = 'VIRAL';
          else if (lower.includes('fda') || lower.includes('health') || lower.includes('recall')) cat = 'HEALTH';
          
          trends.push({ title: title.substring(0,90), desc, image, cat, file: `/${name}` });
        } catch(e) {
          trends.push({ title: name.replace('.html','').replace(/-/g,' '), desc: 'Trending now', image: `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800`, cat: 'TRENDING', file: `/${name}` });
        }
      }
    }
  } catch(e) {
    console.error('Failed to fetch trends', e);
  }

  const cardsHtml = trends.length > 0 ? trends.map((t,i) => {
    const isFeatured = i===0 ? ' featured' : '';
    return `<article class="card${isFeatured}" data-cat="${t.cat}">
      <a class="thumb" href="${t.file}">
        <img src="${t.image}" alt="${t.title}" loading="lazy">
        <span class="badge">${t.cat}</span><span class="score">🔥 9.${Math.floor(Math.random()*4+5)}</span>
      </a>
      <div class="info">
        <h3><a href="${t.file}">${t.title}</a></h3>
        <p class="excerpt">${t.desc}</p>
        <div class="meta"><img src="https://i.pravatar.cc/100?u=trends" alt=""><span>Trends Team</span></div>
      </div>
    </article>`;
  }).join('') : `<div class="loading"><b>No trends yet</b>Upload your first HTML file to GitHub root.</div>`;

  const staticLinksList = htmlFiles.map(name => `<a href="/${name}">${name.replace('.html','').replace(/-/g,' ')}</a>`).join(' • ');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TRENDS.AFDALBOT - What's Burning Right Now</title>
<meta name="description" content="Discover what's burning right now - viral trends, AI leaks, iPhone 17, ChatGPT. Now Bing compliant with crawlable links.">
<link rel="canonical" href="https://trends.afdalbot.com/">
<style>
:root{--fire:#FF4D00;--bg:#060608;--card:#111113;--border:#212127;--text:#f5f5f7;--muted:#8b8b93;--muted2:#5a5a63}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.top{position:sticky;top:0;z-index:100;background:rgba(6,6,8,.9);backdrop-filter:blur(24px);border-bottom:1px solid var(--border)}
.top-inner{max-width:1320px;margin:0 auto;padding:14px 24px;display:flex;justify-content:space-between;align-items:center}
.logo{display:flex;align-items:center;gap:10px;font-weight:800}
.logo-icon{width:34px;height:34px;background:linear-gradient(135deg,var(--fire),#FF8A00);border-radius:10px;display:grid;place-items:center}
.hero{max-width:1320px;margin:0 auto;padding:56px 24px 28px;display:grid;grid-template-columns:1.2fr .8fr;gap:32px}
@media(max-width:860px){.hero{grid-template-columns:1fr}}
.hero h1{font-size:clamp(2.8rem,6vw,4.8rem);line-height:.9;letter-spacing:-3px;font-weight:700}
.hero h1 i{font-style:normal;background:linear-gradient(90deg,var(--fire),#FFD600);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.grid-wrap{max-width:1320px;margin:0 auto;padding:10px 24px 40px}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
.card{grid-column:span 4;background:var(--card);border:1px solid var(--border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column}
@media(max-width:1100px){.card{grid-column:span 6}}@media(max-width:860px){.card{grid-column:span 12}}
.card.featured{grid-column:span 8;flex-direction:row}
@media(max-width:860px){.card.featured{flex-direction:column;grid-column:span 12}}
.card.featured .thumb{flex:1.2;min-height:360px}
.card.featured .info{flex:.8;padding:28px}
.thumb{height:220px;position:relative;overflow:hidden;background:#0e0e11;display:block}
.thumb img{width:100%;height:100%;object-fit:cover}
.badge{position:absolute;top:14px;left:14px;background:var(--fire);color:#fff;padding:5px 11px;border-radius:999px;font-size:.68rem;font-weight:800;z-index:2}
.score{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.7);color:#fff;padding:5px 11px;border-radius:999px;font-size:.76rem;z-index:2}
.info{padding:18px 18px 20px;display:flex;flex-direction:column;flex:1}
.info h3{font-size:1.18rem;line-height:1.25;font-weight:700;margin-bottom:8px}
.info h3 a{color:inherit;text-decoration:none}
.excerpt{color:var(--muted);font-size:.88rem;line-height:1.5;flex:1}
.meta{display:flex;align-items:center;gap:10px;margin-top:14px;color:var(--muted2);font-size:.76rem}
.footer{border-top:1px solid var(--border);padding:48px 24px;background:#08080a}
.footer-inner{max-width:1320px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px;color:var(--muted2);font-size:.82rem}
.footer a{color:var(--muted);text-decoration:none}
.crawlable-links{background:#0e0e11;border:1px solid var(--border);border-radius:12px;padding:16px 20px;margin:20px 24px 0;max-width:1320px;margin-left:auto;margin-right:auto}
.crawlable-links h4{font-size:.85rem;color:var(--muted);margin-bottom:8px}
.crawlable-links a{color:var(--muted);font-size:.8rem;text-decoration:none;margin-right:12px;line-height:2}
.crawlable-links a:hover{color:var(--fire)}
</style>
</head>
<body>
<div class="top"><div class="top-inner"><div class="logo"><div class="logo-icon">🔥</div>TRENDS.AFDALBOT</div><div style="font-size:.8rem;color:#888">${htmlFiles.length} LIVE • Bing Compliant</div></div></div>
<div class="hero"><div><h1>What's <i>BURNING</i><br>Right Now</h1></div><div><p style="color:#8b8b93">The fastest viral trends - now with crawlable links for Bing Guidelines #2 #5 #8</p><p style="color:#5a5a63;font-size:.85rem">${htmlFiles.length} trends live • 100% SEO ready</p></div></div>
<div class="grid-wrap"><div class="grid">${cardsHtml}</div></div>
<div class="crawlable-links">
<h4>🔗 All Trends - Crawlable for Bing (Guideline #5)</h4>
${staticLinksList || '<a href="/chlorthalidone-tablets-fda-recall.html">Chlorthalidone Tablets FDA Recall</a>'}
</div>
<div class="footer"><div class="footer-inner"><div>© 2026 trends.afdalbot.com — Bing Guidelines Compliant • <a href="https://www.facebook.com/profile.php?id=61595079112655" target="_blank" rel="noopener noreferrer me">Facebook</a> • <a href="https://x.com/mod_app_game" target="_blank" rel="noopener noreferrer me">Twitter/X</a></div><div><a href="/sitemap.xml">Sitemap</a> • <a href="/robots.txt">Robots</a> • <a href="https://www.facebook.com/profile.php?id=61595079112655" target="_blank" rel="noopener noreferrer me">FB</a> • <a href="https://x.com/mod_app_game" target="_blank" rel="noopener noreferrer me">𝕏</a></div></div></div>

<!-- Guideline #11 + #14: Social profiles with sameAs for trust -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "trends.afdalbot.com",
  "url": "https://trends.afdalbot.com/",
  "logo": "https://trends.afdalbot.com/favicon.ico",
  "sameAs": [
    "https://www.facebook.com/profile.php?id=61595079112655",
    "https://x.com/mod_app_game"
  ]
}
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Bing-Guidelines': 'Compliant #2 #5 #8'
    }
  });
}
