// Lauren Wynne Portfolio — Cloudflare Worker (Claude API proxy)
//
// DEPLOY INSTRUCTIONS:
// 1. Install Wrangler: npm install -g wrangler
// 2. wrangler login
// 3. wrangler deploy   (from this directory, after setting up wrangler.toml)
// 4. Add your Anthropic key as a secret:
//    wrangler secret put ANTHROPIC_API_KEY
//    (paste your key when prompted — it's stored securely, never in code)
// 5. Copy the deployed URL into project-chat.js → WORKER_URL

export default {
  async fetch(request, env) {
    // CORS — only allow requests from the portfolio domain
    const origin = request.headers.get('Origin') || '';
    const allowed = ['https://www.laurenwynne.com', 'http://localhost:8000'];
    if (!allowed.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response('Bad request', { status: 400, headers: corsHeaders }); }

    const { system, messages } = body;
    if (!messages?.length) {
      return new Response('Bad request', { status: 400, headers: corsHeaders });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 512,
        system:     system || '',
        messages
      })
    });

    const data = await anthropicRes.json();
    return new Response(JSON.stringify(data), {
      status: anthropicRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
