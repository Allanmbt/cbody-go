import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_MEDIA_PER_GIRL = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[get-upload-url] Request received');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[get-upload-url] No auth header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[get-upload-url] Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[get-upload-url] Environment configured');

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('[get-upload-url] Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[get-upload-url] User authenticated:', user.id);

    const requestBody = await req.json();
    console.log('[get-upload-url] Request body:', requestBody);
    
    const { girl_id, kind, ext, hasThumb, meta } = requestBody;

    // Verify ownership
    console.log('[get-upload-url] Checking girl ownership:', { girl_id, user_id: user.id });
    
    const { data: girl, error: girlError } = await supabaseAdmin
      .from('girls')
      .select('id')
      .eq('id', girl_id)
      .eq('user_id', user.id)
      .single();

    if (girlError || !girl) {
      console.error('[get-upload-url] Girl check failed:', girlError);
      return new Response(JSON.stringify({ 
        error: 'Forbidden: Not your girl profile',
        details: girlError?.message 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[get-upload-url] Girl ownership verified');

    // Check quota
    console.log('[get-upload-url] Checking quota');
    
    const { count, error: countError } = await supabaseAdmin
      .from('girls_media')
      .select('*', { count: 'exact', head: true })
      .eq('girl_id', girl_id)
      .in('status', ['pending', 'approved']);

    if (countError) {
      console.error('[get-upload-url] Count error:', countError);
    }

    console.log('[get-upload-url] Current media count:', count);

    if (count && count >= MAX_MEDIA_PER_GIRL) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_MEDIA_PER_GIRL} media items allowed` }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate UUID and paths
    const uuid = crypto.randomUUID();
    const tmpKeyMain = `${user.id}/${uuid}/main.${ext}`;
    const tmpKeyThumb = hasThumb ? `${user.id}/${uuid}/thumb.jpg` : null;

    // Get signed upload URLs (use admin client to bypass RLS)
    console.log('[get-upload-url] Creating upload URL for:', tmpKeyMain);
    
    const { data: urlMain, error: urlMainError } = await supabaseAdmin.storage
      .from('tmp-uploads')
      .createSignedUploadUrl(tmpKeyMain);

    if (urlMainError || !urlMain) {
      console.error('[get-upload-url] Upload URL error:', urlMainError);
      throw new Error(`Failed to create main upload URL: ${urlMainError?.message || 'Unknown error'}`);
    }

    console.log('[get-upload-url] Upload URL created successfully');

    let urlThumb = null;
    if (tmpKeyThumb) {
      const { data: thumbData, error: urlThumbError } = await supabaseAdmin.storage
        .from('tmp-uploads')
        .createSignedUploadUrl(tmpKeyThumb);

      if (urlThumbError || !thumbData) {
        throw new Error('Failed to create thumb upload URL');
      }
      urlThumb = thumbData;
    }

    // Insert draft record
    console.log('[get-upload-url] Inserting media record');
    
    const insertData = {
      girl_id,
      kind,
      storage_key: tmpKeyMain,
      thumb_key: tmpKeyThumb,
      meta: meta || {},
      status: 'pending',
      created_by: user.id,
      sort_order: count || 0,
    };
    
    console.log('[get-upload-url] Insert data:', insertData);
    
    const { data: recordDraft, error: insertError } = await supabaseAdmin
      .from('girls_media')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !recordDraft) {
      console.error('[get-upload-url] Insert error:', insertError);
      throw new Error(`Failed to create media record: ${insertError?.message || 'Unknown error'}`);
    }

    console.log('[get-upload-url] Media record created:', recordDraft.id);

    return new Response(
      JSON.stringify({
        putUrlMain: urlMain.signedUrl,
        putUrlThumb: urlThumb?.signedUrl,
        tmpKeyMain,
        tmpKeyThumb,
        recordDraft,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[get-upload-url] Unhandled error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
