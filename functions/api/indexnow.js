/**
 * IndexNow - MANUAL ONLY MODE
 * تم حذف الإرسال التلقائي - الإرسال يدوي فقط عبر ?url=
 */

export async function onRequest(context) {
  const DOMAIN = 'trends.afdalbot.com';
  const INDEXNOW_KEY = '161c2d819a244a699639cc876148b31d';
  const requestUrl = new URL(context.request.url);
  const singleUrl = requestUrl.searchParams.get('url');

  // إذا لم يتم تمرير ?url= ارجع رسالة توضيحية ولا ترسل شيء تلقائيا
  if (!singleUrl) {
    return new Response(JSON.stringify({
      success: false,
      mode: "manual-only",
      message: "Automatic submission disabled. Use manual ?url= parameter only.",
      error: "Missing ?url= parameter. Example: /api/indexnow?url=https://trends.afdalbot.com/your-page.html",
      usage: {
        manual: `https://${DOMAIN}/api/indexnow?url=https://${DOMAIN}/your-page.html`,
        example: `https://${DOMAIN}/api/indexnow?url=https://${DOMAIN}/strait-of-hormuz-oil-flow-rebound.html`
      }
    }, null, 2), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
  }

  try {
    // تحقق أن الرابط يتبع نفس الدومين
    try {
      const parsed = new URL(singleUrl);
      if (parsed.hostname !== DOMAIN && parsed.hostname !== `www.${DOMAIN}`) {
        throw new Error('URL must belong to ' + DOMAIN);
      }
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid URL: ' + e.message }), { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    const urls = [singleUrl];
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
      message: 'Manual IndexNow submission',
      mode: 'manual-single',
      key: INDEXNOW_KEY,
      submitted: urls.length,
      urls: urls,
      indexnow_status: res1.status,
      bing_status: res2.status
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
