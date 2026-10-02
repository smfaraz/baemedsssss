/**
 * BaeMeds /api/v1 Serverless Entry Point
 */

import { V1Gateway } from '../server/api/v1/v1Gateway.ts';
import { createVercelHandler } from '../server/serverlessAdapter.ts';

export default createVercelHandler(async (request: Request): Promise<Response> => {
  return await V1Gateway.dispatch(request);
});
