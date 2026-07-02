import { createRequire } from 'node:module';
import { withLambda } from '@netlify/aws-lambda-compat';

const require = createRequire(import.meta.url);
const { handler } = require('../function-handlers/submit-ticket.cjs');

export default withLambda(handler);
