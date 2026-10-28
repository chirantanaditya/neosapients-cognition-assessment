import {setCallbackPreference} from '../../../lib/database.js';

export const prerender = false;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function POST({request}) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ok: false}, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ok: false}, 415);
  }

  try {
    const input = await request.json();
    const validId = typeof input.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id);
    if (!validId || typeof input.requested !== 'boolean') return json({ok: false}, 400);
    if (!setCallbackPreference(input.id, input.requested)) return json({ok: false}, 404);
    return json({ok: true, requested: input.requested});
  } catch (error) {
    console.error('Callback preference failed:', error);
    return json({ok: false}, 500);
  }
}

export function ALL() {
  return json({ok: false}, 405);
}
