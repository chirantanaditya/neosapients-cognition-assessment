import {saveAssessment} from '../../lib/database.js';
import {integrationRuntimeEnv} from '../../lib/integration-runtime.js';
import {deliverAssessment} from '../../lib/integrations.js';
import {validateAndScoreSubmission} from '../../lib/submission.js';
import {env} from 'cloudflare:workers';

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
  if (origin && origin !== new URL(request.url).origin) return json({ok: false, message: 'Request origin was not accepted.'}, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ok: false, message: 'Expected a JSON request.'}, 415);
  }
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > 30000) return json({ok: false, message: 'Request is too large.'}, 413);

  try {
    const raw = await request.text();
    if (!raw || raw.length > 30000) return json({ok: false, message: 'Invalid request.'}, 400);
    const record = validateAndScoreSubmission(JSON.parse(raw));
    const source = request.headers.get('referer') || new URL(request.url).origin;
    const saved = await saveAssessment(env.DB, record, source);
    const integrations = await deliverAssessment(record, integrationRuntimeEnv(env));
    console.info('Assessment integrations:', record.id, integrations);
    return json({...saved, integrations});
  } catch (error) {
    console.error('Assessment save failed:', error);
    const invalid = error instanceof SyntaxError || (error instanceof Error && error.message.startsWith('INVALID_'));
    return json({
      ok: false,
      message: invalid
        ? 'The assessment submission was incomplete or invalid.'
        : 'We could not save the result. Please try again.',
    }, invalid ? 400 : 500);
  }
}

export function ALL() {
  return json({ok: false, message: 'Method not allowed.'}, 405);
}
