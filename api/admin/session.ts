import '../../server/polyfill.ts';
import {
  ApiError,
  json,
} from '../../server/commerce.ts';
import { resolveAdminActor } from '../admin.ts';
import { createVercelHandler } from '../../server/serverlessAdapter.ts';

export default createVercelHandler(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Role',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  try {
    const actor = await resolveAdminActor(request);
    return json({ user: actor });
  } catch (error: any) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    return json({ error: error.message || 'Unauthorized' }, 401);
  }
});
