import { createRequire } from 'node:module';
import { withLambda } from '@netlify/aws-lambda-compat';

const require = createRequire(import.meta.url);
const { handler } = require('../function-handlers/send-invite.cjs');

export default withLambda(handler);
