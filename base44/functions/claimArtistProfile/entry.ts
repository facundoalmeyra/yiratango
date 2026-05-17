import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { claim_code } = await req.json();

    if (!claim_code) {
      return Response.json({ error: 'claim_code is required' }, { status: 400 });
    }

    // User must be authenticated to claim a profile
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the artist with this claim_code
    const artists = await base44.asServiceRole.entities.Artist.filter({ claim_code: claim_code.trim().toUpperCase() });

    if (!artists || artists.length === 0) {
      return Response.json({ error: 'Invalid claim code. No artist profile found.' }, { status: 404 });
    }

    const artist = artists[0];

    // Link the artist profile to the current user (allows re-linking)
    const userId = user.email || user.id;
    await base44.asServiceRole.entities.Artist.update(artist.id, {
      claimed_by_user_id: userId,
      user_id: userId
    });

    return Response.json({
      success: true,
      artist_id: artist.id,
      artist_name: artist.name,
      artist_slug: artist.slug,
      message: `Profile "${artist.name}" successfully linked to your account.`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});