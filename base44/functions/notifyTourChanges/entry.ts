import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        const { event, data, old_data } = payload;
        
        if (event.type !== 'create' && event.type !== 'update') {
            return Response.json({ success: true, message: 'Ignored event type' });
        }

        let artistId = data.artist_id;
        if (!artistId) return Response.json({ success: true });

        // Resolve slug to real ID if needed (handles manual imports with slug as artist_id)
        let artist = null;
        try {
          artist = await base44.asServiceRole.entities.Artist.get(artistId);
        } catch (_) {}

        if (!artist) {
          // artistId might be a slug — search by slug
          const bySlug = await base44.asServiceRole.entities.Artist.filter({ slug: artistId });
          if (bySlug.length > 0) {
            artist = bySlug[0];
            // Fix the tour record to use the real ID
            await base44.asServiceRole.entities.Tour.update(event.entity_id, { artist_id: artist.id });
            artistId = artist.id;
          }
        }

        if (!artist) return Response.json({ success: true });

        const isNew = event.type === 'create';
        
        const follows = await base44.asServiceRole.entities.Follow.filter({ artist_id: artistId });
        const followerEmails = follows.map(f => f.fan_user_id);

        const fans = await base44.asServiceRole.entities.Fan.filter({});

        const notificationsToCreate = [];

        // Identify if it's their first tour
        const allArtistTours = await base44.asServiceRole.entities.Tour.filter({ artist_id: artistId });
        const isFirstTour = allArtistTours.length <= 1;

        // Followers
        for (const email of followerEmails) {
            if (isNew) {
                const messageType = isFirstTour ? "started a new tour" : "added a new date";
                notificationsToCreate.push({
                    fan_user_id: email,
                    artist_id: artistId,
                    artist_name: artist.name,
                    artist_slug: artist.slug || artist.id,
                    artist_avatar: artist.avatar_url,
                    type: isFirstTour ? "new_tour" : "new_date",
                    message: `${artist.name} ${messageType} in ${data.city}`,
                    link: `/artist?p=${artist.slug || artist.id}`
                });
            }
        }

        // Discovery (Non-followers within radius)
        if (isNew || (event.type === 'update' && (data.latitude !== old_data?.latitude || data.longitude !== old_data?.longitude))) {
            const tourLat = data.latitude;
            const tourLng = data.longitude;

            if (tourLat && tourLng) {
                for (const fan of fans) {
                    if (followerEmails.includes(fan.user_id)) continue;

                    const radius = fan.discovery_radius || 50;
                    const fanLat = fan.latitude;
                    const fanLng = fan.longitude;

                    const dist = getDistanceFromLatLonInKm(tourLat, tourLng, fanLat, fanLng);
                    if (dist <= radius) {
                        notificationsToCreate.push({
                            fan_user_id: fan.user_id,
                            artist_id: artistId,
                            artist_name: artist.name,
                            artist_slug: artist.slug || artist.id,
                            artist_avatar: artist.avatar_url,
                            type: "discovery",
                            message: `${artist.name} is planning to be near you in ${data.city}`,
                            link: `/artist?p=${artist.slug || artist.id}`
                        });
                    }
                }
            }
        }

        if (notificationsToCreate.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notificationsToCreate);
        }

        return Response.json({ success: true, count: notificationsToCreate.length });
    } catch (error) {
        console.error('Error notifying tour changes:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});