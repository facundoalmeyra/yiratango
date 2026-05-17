import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Use service role to list all artists
        const artists = await base44.asServiceRole.entities.Artist.list();
        
        const url = new URL(req.url);
        // Base44 functions use the same domain, we remove the function path to get the root
        const protocol = url.protocol === 'http:' && url.hostname === 'localhost' ? 'http:' : 'https:';
        const baseUrl = 'https://yiratango.com';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/Map</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/List</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

        for (const p of artists) {
            const slugOrId = p.slug || p.id;
            xml += `
  <url>
    <loc>${baseUrl}/ArtistProfile?p=${slugOrId}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }

        xml += `\n</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600'
            },
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});