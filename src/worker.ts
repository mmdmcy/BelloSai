export interface Env {}

export default {
  async fetch(request): Promise<Response> {
    // With `assets.directory` configured in wrangler.jsonc, Workers Sites will
    // automatically serve files from ./dist. We just need to ensure SPA fallback.
    // Try to serve the asset first; if not found, fall back to index.html
    const url = new URL(request.url);

    // For API or edge function calls, just pass through (none defined here)
    if (url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    // Rely on Cloudflare's assets handling by returning undefined here is not possible.
    // Use the built-in "assets" binding available when using assets.directory.
    // Wrangler injects an ASSETS object at runtime. We'll use it if present.
    // @ts-ignore - ASSETS is available at runtime
    const assets = (globalThis as any).ASSETS;

    if (assets && typeof assets.fetch === 'function') {
      // Try to fetch the exact asset
      let response = await assets.fetch(request);
      if (response && response.status !== 404) {
        return response;
      }
      // SPA fallback to index.html
      const fallbackUrl = new URL('/index.html', url.origin);
      const fallbackRequest = new Request(fallbackUrl.toString(), request);
      response = await assets.fetch(fallbackRequest);
      if (response) return response;
    }

    return new Response('Not Found', { status: 404 });
  },
};


