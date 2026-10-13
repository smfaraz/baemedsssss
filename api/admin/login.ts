import '../../server/polyfill.ts';
import {
  ApiError,
  json,
  readJson,
} from '../../server/commerce.ts';
import {
  AdminService,
} from '../../server/adminService.ts';
import { createVercelHandler } from '../../server/serverlessAdapter.ts';

export default createVercelHandler(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Role',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = await readJson<{ email?: string; password?: string }>(request);
  if (!body.email || !body.password) {
    throw new ApiError(400, 'Staff email and password are required.');
  }

  try {
    const result = await AdminService.authenticateStaff(body.email, body.password);
    return json(result);
  } catch (authErr: any) {
    throw new ApiError(
      authErr.message?.includes('deactivated') ? 403 : 401,
      authErr.message || 'Invalid credentials.'
    );
  }
});
