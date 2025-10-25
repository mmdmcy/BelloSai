export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

function injectRuntimeEnvIntoHtml(html: string, env: Env): string {
  const runtime = {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  };
  const script = `<script>window.__ENV__=${JSON.stringify(runtime)}</script>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', script + '</head>');
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', script + '</body>');
  }
  return html + script;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/__env') {
      const body = JSON.stringify({
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY_present: !!env.VITE_SUPABASE_ANON_KEY,
        VITE_STRIPE_PUBLISHABLE_KEY_present: !!env.VITE_STRIPE_PUBLISHABLE_KEY,
      }, null, 2);
      return new Response(body, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        }
      });
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    // Try to serve the requested asset first
    let response = await env.ASSETS.fetch(request);

    // If not found, SPA fallback to index.html
    if (!response || response.status === 404) {
      const fallbackUrl = new URL('/index.html', url.origin);
      const fallbackRequest = new Request(fallbackUrl.toString(), request);
      response = await env.ASSETS.fetch(fallbackRequest);
    }

    if (!response) {
      return new Response('Not Found', { status: 404 });
    }

    // If HTML, inject runtime env for frontend to consume
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await response.text();
      const injected = injectRuntimeEnvIntoHtml(html, env);
      const headers = new Headers(response.headers);
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'no-store');
      headers.set('x-env-injected', '1');
      return new Response(injected, { headers, status: response.status });
    }

    // For the main Vite entry chunk, prepend env assignment to guarantee availability
    if (url.pathname.startsWith('/assets/index-') && contentType.includes('javascript')) {
      const js = await response.text();
      const runtime = {
        VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
        VITE_STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      };
      const prelude = `;window.__ENV__=Object.assign({}, ${JSON.stringify(runtime)}, window.__ENV__||{});`;
      const headers = new Headers(response.headers);
      headers.set('content-type', 'application/javascript; charset=utf-8');
      headers.set('cache-control', 'no-store');
      headers.set('x-env-prepended', '1');
      return new Response(prelude + js, { headers, status: response.status });
    }

    return response;
  },
};


