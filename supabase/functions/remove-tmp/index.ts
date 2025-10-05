import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { media_id } = await req.json();

    // Get media record
    const { data: media, error: fetchError } = await supabase
      .from('girls_media')
      .select('*, girls!inner(user_id)')
      .eq('id', media_id)
      .single();

    if (fetchError || !media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check ownership and status
    if (media.girls.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (media.status !== 'pending' && media.status !== 'rejected') {
      return new Response(JSON.stringify({ error: 'Can only delete pending or rejected media' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract UUID from storage_key (format: user_id/uuid/main.ext)
    const parts = media.storage_key.split('/');
    if (parts.length >= 2) {
      const uuid = parts[1];
      const prefix = `${user.id}/${uuid}`;

      // List all files in this directory
      const { data: files } = await supabase.storage.from('tmp-uploads').list(`${user.id}/${uuid}`);

      if (files && files.length > 0) {
        // Delete all files in the directory
        const filesToDelete = files.map((f) => `${prefix}/${f.name}`);
        await supabase.storage.from('tmp-uploads').remove(filesToDelete);
      }
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('girls_media')
      .delete()
      .eq('id', media_id);

    if (deleteError) {
      throw new Error('Failed to delete media record');
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
