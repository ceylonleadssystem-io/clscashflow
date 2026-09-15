const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payable-Webhook-Secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  return { statusCode: 503, headers, body: JSON.stringify({ ok: false, error: 'Webhook is being finalized on Appwrite.' }) };
};
