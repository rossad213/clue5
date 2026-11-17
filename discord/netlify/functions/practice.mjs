import originalHandler from '../../api/practice.js';
import {run} from '../adapter.mjs';

export default async function handler(request) {
  return run(originalHandler, request);
}

export const config = {path:'/api/practice'};
