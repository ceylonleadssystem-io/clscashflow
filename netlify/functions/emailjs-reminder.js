const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { ok: false, error: 'Invalid JSON payload' });
  }

  const params = payload.params || {};
  const config = payload.config || {};
  const serviceId = process.env.EMAILJS_SERVICE_ID || config.serviceId || 'service_uneb8lv';
  const templateId = process.env.EMAILJS_TEMPLATE_ID || config.templateId || 'template_5xb3yer';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || config.publicKey || 'gCD6W70FKqiN2ATlp';
  const privateKey = process.env.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_ACCESS_TOKEN || '';

  if (!params.to_email) {
    return json(400, { ok: false, error: 'Missing to_email for payment reminder' });
  }
  if (!serviceId || !templateId || !publicKey) {
    return json(500, { ok: false, error: 'EmailJS service ID, template ID, or public key is missing' });
  }
  if (!privateKey) {
    return json(501, {
      ok: false,
      error: 'Netlify EMAILJS_PRIVATE_KEY is not configured. Add the EmailJS private key as a Netlify environment variable for server-side fallback.'
    });
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: params
  };

  try {
    const response = await fetch(EMAILJS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    if (!response.ok) {
      return json(response.status, {
        ok: false,
        error: text || `EmailJS returned HTTP ${response.status}`
      });
    }
    return json(200, { ok: true, message: text || 'Email sent' });
  } catch (error) {
    return json(502, { ok: false, error: error.message || 'EmailJS request failed' });
  }
};
