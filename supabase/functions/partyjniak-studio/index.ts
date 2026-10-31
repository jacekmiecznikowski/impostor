// Compatibility: Supabase Edge Functions on the default domain rewrite HTML
// to plain text. Redirect historical editor links to GitHub Pages instead.
Deno.serve((request: Request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://jacekmiecznikowski.github.io/impostor/',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer'
    }
  });
});
