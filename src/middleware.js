import {defineMiddleware} from 'astro:middleware';

const ROBOTS_POLICY = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', ROBOTS_POLICY);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
