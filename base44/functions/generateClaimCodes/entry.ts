import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Generates a random 8-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all artists without a claim_code
    const allArtists = await base44.asServiceRole.entities.Artist.list();
    const artistsWithoutCode = allArtists.filter(a => !a.claim_code);

    if (artistsWithoutCode.length === 0) {
      return Response.json({ message: 'All artists already have claim codes.', updated: 0 });
    }

    // Update each artist with a unique code
    const updates = [];
    for (const artist of artistsWithoutCode) {
      const code = generateCode();
      await base44.asServiceRole.entities.Artist.update(artist.id, { claim_code: code });
      updates.push({ id: artist.id, name: artist.name, claim_code: code });
    }

    return Response.json({
      success: true,
      updated: updates.length,
      artists: updates
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});