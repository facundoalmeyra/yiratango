import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const params = url.searchParams;

    // Image proxy: fetches artist image by slug and serves as image/jpeg
    // URL ends in .jpg (e.g. ?img=facundo-almeyra.jpg) so Facebook accepts the extension
    const imageSlugRaw = params.get('img');
    if (imageSlugRaw) {
        // Strip any extension (.jpg, .png, etc.) to get the clean slug
        const imageSlug = imageSlugRaw.replace(/\.[^.]+$/, '');
        const base44 = createClientFromRequest(req);
        let imgUrl = null;
        const artists = await base44.entities.Artist.filter({ slug: imageSlug }, null, 1);
        if (artists && artists.length > 0 && artists[0].avatar_url) {
            imgUrl = artists[0].avatar_url;
            // Convert private base44.app URLs to public CDN
            if (imgUrl.includes('base44.app/api/apps')) {
                const match = imgUrl.match(/\/files\/public\/(.+)/);
                if (match) imgUrl = `https://media.base44.com/images/public/${match[1]}`;
            }
        }
        if (!imgUrl) {
            imgUrl = "https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/530951993_newyiralogo.png";
        }
        const imgRes = await fetch(imgUrl);
        const imgBuffer = await imgRes.arrayBuffer();
        return new Response(imgBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    let slug = params.get('p') || params.get('slug') || params.get('id');
    
    // Also check payload if invoked via POST/JSON
    if (!slug && req.method === 'POST') {
        try {
            const body = await req.json();
            slug = body.p || body.slug || body.id;
        } catch (e) {
            // Ignore JSON parse errors
        }
    }

    if (!slug) {
        return new Response("<html><body>Missing p parameter</body></html>", {
            status: 400,
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // 1. Fetch Artist Data
    let artist = null;
    const bySlug = await base44.entities.Artist.filter({ slug: slug }, null, 1);

    if (bySlug && bySlug.length > 0) {
        artist = bySlug[0];
    } else {
        // Try by ID using get()
        try {
            const byId = await base44.entities.Artist.get(slug);
            if (byId) artist = byId;
        } catch (e) {
            // Not found by ID either
        }
    }

    if (!artist) {
        return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Yira Tango" />
          <meta property="og:description" content="Find Tango Artists, Workshops & Milongas Near You" />
          <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/d74c463db_favicon2.png" />
          <meta http-equiv="refresh" content="0;url=https://yiratango.com" />
        </head>
        <body>Redirecting...</body>
        </html>
        `, {
            status: 404,
            headers: { 'Content-Type': 'text/html' }
        });
    }

    const displayName = (!artist.category || artist.category === 'Maestro') && artist.profileType === 'Couple' && artist.partner_name 
        ? `${artist.name} & ${artist.partner_name}` 
        : artist.name;

    const description = artist.bio 
        ? `Follow ${displayName} on Yira Tango. ${artist.bio.substring(0, 100)}...`
        : `Follow ${displayName} on Yira Tango.`;

    // Convert base44.app private URLs to public media CDN so Facebook can access them
    let imageUrl = artist.avatar_url || "https://media.base44.com/images/public/6985f5bb902ec2f8c9596a0d/530951993_newyiralogo.png";
    if (imageUrl.includes('base44.app/api/apps')) {
        // Extract the path after /files/public/ and rebuild as media CDN URL
        const match = imageUrl.match(/\/files\/public\/(.+)/);
        if (match) {
            imageUrl = `https://media.base44.com/images/public/${match[1]}`;
        }
    }
    const targetUrl = `https://yiratango.com/en/ArtistProfile?p=${artist.slug || artist.id}`;
    // og:url must point to THIS function URL so Meta doesn't follow the redirect and lose the tags
    const canonicalUrl = `https://yiratango.com/api/functions/go?p=${artist.slug || artist.id}`;
    // Proxy URL ends in .jpg so Facebook accepts it — the proxy strips the extension internally
    const ogImageUrl = `https://yiratango.com/api/functions/go?img=${artist.slug || artist.id}.jpg`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${displayName} - Yira Tango</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="fb:app_id" content="899332766331592" />
  <meta property="og:type" content="profile" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${displayName} - Yira Tango" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonicalUrl}" />
  <meta name="twitter:title" content="${displayName} - Yira Tango" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImageUrl}" />

  <style>
    body { background: #0F0F0F; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .loader { border: 4px solid #333; border-top: 4px solid #fff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <script>
    window.location.href = "${targetUrl}";
  </script>
</body>
</html>
    `;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=60'
        }
    });

  } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});