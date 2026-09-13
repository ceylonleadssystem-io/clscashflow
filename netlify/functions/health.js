'use strict';

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }, body: '' };
  }
  const body = JSON.stringify({ ok: true, service: 'ceylonry', time: new Date().toISOString() });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: event.httpMethod === 'HEAD' ? '' : body
  };
};
