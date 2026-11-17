import originalHandler from '../../api/token.js';
import {run} from '../adapter.mjs';

export default async function handler(request) {
  return run(originalHandler, request);
}

export const config = {path:'/api/token'};
