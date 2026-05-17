import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify admin
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let deletedCount = 0;
        let hasMore = true;

        while (hasMore) {
            // Fetch oldest notifications first (sorting ascending by created_date)
            const notifications = await base44.asServiceRole.entities.Notification.list('created_date', 100);
            
            if (notifications.length === 0) {
                break;
            }

            const toDelete = notifications.filter(n => new Date(n.created_date) < thirtyDaysAgo);
            
            if (toDelete.length > 0) {
                await Promise.all(toDelete.map(n => base44.asServiceRole.entities.Notification.delete(n.id)));
                deletedCount += toDelete.length;
            }
            
            // If the oldest batch has elements newer than 30 days, we're done
            if (toDelete.length < notifications.length) {
                hasMore = false;
            }
        }

        return Response.json({ success: true, deletedCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});