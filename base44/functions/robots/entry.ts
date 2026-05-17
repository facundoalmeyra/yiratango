Deno.serve(async (req) => {
    const url = new URL(req.url);
    const protocol = url.protocol === 'http:' && url.hostname === 'localhost' ? 'http:' : 'https:';
    const baseUrl = `${protocol}//${url.host}`;
    
    const txt = `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${baseUrl}/api/functions/sitemap`;

    return new Response(txt, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=3600'
        },
    });
});