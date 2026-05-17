Deno.serve(async (req) => {
    const txt = `# Yira Tango
> Discover Tango performers, workshops & milongas near you with an interactive 3D map. Explore the global tango community and never miss an event.

## Features
- Interactive 3D globe to find Tango events worldwide.
- Profiles of Tango Maestros, DJs, and Musicians.
- Schedule of upcoming tours and workshops.

## Directory
Browse our directory of performers to see where they are currently located and their upcoming tour dates.
`;

    return new Response(txt, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
        },
    });
});