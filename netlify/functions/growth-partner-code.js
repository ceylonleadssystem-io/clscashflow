const { firebaseAdminFacade } = require('../lib/supabase');

const responseHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

function reply(statusCode, body) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return reply(204, {});
  if (event.httpMethod !== 'GET') return reply(405, { valid: false, error: 'Method not allowed.' });
  const code = String((event.queryStringParameters || {}).code || '').trim().toUpperCase();
  if (!/^CGP-\d{4,6}$/.test(code)) return reply(400, { valid: false, error: 'Use the code format CGP-0001.' });

  try {
    const db = firebaseAdminFacade().firestore();
    const codeSnap = await db.collection('growthPartnerCodes').doc(code).get();
    if (!codeSnap.exists) return reply(404, { valid: false, error: 'This Growth Partner code was not found.' });
    const codeData = codeSnap.data() || {};
    const partnerId = String(codeData.partnerId || '').trim();
    if (String(codeData.status || '').toUpperCase() !== 'ASSIGNED' || !partnerId) {
      return reply(404, { valid: false, error: 'This Growth Partner code is not active.' });
    }
    const partnerSnap = await db.collection('growthPartners').doc(partnerId).get();
    const partner = partnerSnap.exists ? (partnerSnap.data() || {}) : {};
    if (!partnerSnap.exists || String(partner.status || '').toLowerCase() !== 'active') {
      return reply(404, { valid: false, error: 'This Growth Partner code is not active.' });
    }
    return reply(200, { valid: true, code, partnerId, partnerName: String(partner.fullName || partner.name || '') });
  } catch (error) {
    console.error('Growth Partner code validation failed:', error);
    return reply(503, { valid: false, error: 'We could not verify the code right now. Please try again.' });
  }
};
