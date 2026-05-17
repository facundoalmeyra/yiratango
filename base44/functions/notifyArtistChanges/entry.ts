import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        const { event, data, old_data } = payload;
        
        if (event.type !== 'update') {
            return Response.json({ success: true, message: 'Ignored event type' });
        }

        // Check if base location changed
        const cityChanged = data.current_city !== old_data?.current_city;
        const locationChanged = data.current_latitude !== old_data?.current_latitude || data.current_longitude !== old_data?.current_longitude;

        if (!cityChanged && !locationChanged) {
            return Response.json({ success: true, message: 'No location change' });
        }
        
        if (!data.current_city) {
             return Response.json({ success: true, message: 'No current city to report' });
        }

        const artistId = data.id;
        
        const follows = await base44.asServiceRole.entities.Follow.filter({ artist_id: artistId });
        const followerEmails = follows.map(f => f.fan_user_id);

        const notificationsToCreate = [];

        for (const email of followerEmails) {
            notificationsToCreate.push({
                fan_user_id: email,
                artist_id: artistId,
                artist_name: data.name,
                artist_slug: data.slug || artistId,
                artist_avatar: data.avatar_url,
                type: "base_location_change",
                message: `updated their base location to ${data.current_city}`,
                link: `/artist?p=${data.slug || artistId}`
            });
        }

        if (notificationsToCreate.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notificationsToCreate);
        }

        return Response.json({ success: true, count: notificationsToCreate.length });
    } catch (error) {
        console.error('Error notifying artist changes:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});