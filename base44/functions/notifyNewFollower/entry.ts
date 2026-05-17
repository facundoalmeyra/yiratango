import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        const { event, data } = payload;
        
        if (event.type !== 'create') {
            return Response.json({ success: true, message: 'Ignored event type' });
        }

        const artistId = data.artist_id;
        
        // Fetch the artist to get their user_id
        const artist = await base44.asServiceRole.entities.Artist.get(artistId);
        
        if (!artist || !artist.created_by) {
            return Response.json({ success: false, message: 'Artist not found or has no user' });
        }
        
        // Find existing follow notifications for this artist today
        const existingNotifications = await base44.asServiceRole.entities.Notification.filter({
            fan_user_id: artist.created_by,
            artist_id: artistId,
            type: "new_follower"
        });
        
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const recentNotifications = existingNotifications.filter(n => {
            if (!n.created_date) return false;
            const notifDate = new Date(n.created_date);
            return notifDate >= today;
        });

        // Get fan details
        const fanRecords = await base44.asServiceRole.entities.Fan.filter({ user_id: data.fan_user_id });
        const fanName = fanRecords.length > 0 ? fanRecords[0].name : "Someone";
        const fanAvatar = fanRecords.length > 0 ? fanRecords[0].avatar_url : null;
        
        // Find all follows to know the total count
        const allFollows = await base44.asServiceRole.entities.Follow.filter({ artist_id: artistId });
        const newFollowCount = allFollows.filter(f => {
             const fDate = new Date(f.created_date);
             return fDate >= today;
        }).length;
        
        let message = `${fanName} started following you`;
        if (newFollowCount > 1) {
            // Get names of recent followers
            const recentFollowers = [];
            for (const f of allFollows) {
                 if (new Date(f.created_date) >= today) {
                     const fRecords = await base44.asServiceRole.entities.Fan.filter({ user_id: f.fan_user_id });
                     if (fRecords.length > 0 && fRecords[0].name !== fanName) {
                         recentFollowers.push(fRecords[0].name);
                     }
                 }
            }
            
            if (newFollowCount === 2 && recentFollowers.length > 0) {
                 message = `${fanName} and ${recentFollowers[0]} started following you`;
            } else if (newFollowCount > 2 && recentFollowers.length > 0) {
                 message = `${fanName}, ${recentFollowers[0]} and ${newFollowCount - 2} others started following you`;
            }
        }
        
        // If there is an existing notification for today, delete it and create a new one to bubble it up
        if (recentNotifications.length > 0) {
            await Promise.all(recentNotifications.map(n => 
                base44.asServiceRole.entities.Notification.delete(n.id)
            ));
        }

        await base44.asServiceRole.entities.Notification.create({
            fan_user_id: artist.created_by,
            artist_id: artistId,
            artist_name: "New Follower",
            artist_slug: null,
            artist_avatar: fanAvatar,
            type: "new_follower",
            message: message,
            link: null
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Error notifying new follower:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});