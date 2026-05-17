import { createClientFromRequest } from 'npm:@base44/sdk@0.8.18';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const { role } = payload;

        const ALLOWED_ROLES = ['admin', 'fan', 'artist', 'organizer'];
        if (!role || !ALLOWED_ROLES.includes(role)) {
            return Response.json({ error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` }, { status: 400 });
        }

        // Update user role using service role
        await base44.asServiceRole.entities.User.update(user.id, { role });

        return Response.json({ success: true, role });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});