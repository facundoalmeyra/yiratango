import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Service-role client that works even without a user token
const serviceClient = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  requiresAuth: false,
});

Deno.serve(async (req) => {
  try {
    const { claim_code } = await req.json();

    if (!claim_code) {
      return Response.json({ error: 'claim_code is required' }, { status: 400 });
    }

    const artists = await serviceClient.asServiceRole.entities.Artist.filter({ claim_code: claim_code.trim().toUpperCase() });

    if (!artists || artists.length === 0) {
      return Response.json({ found: false });
    }

    const artist = artists[0];
    return Response.json({
      found: true,
      name: artist.name,
      avatar_url: artist.avatar_url || null,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});