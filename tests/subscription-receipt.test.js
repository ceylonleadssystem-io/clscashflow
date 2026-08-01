const test=require('node:test');const assert=require('node:assert/strict');
const receipt=require('../netlify/functions/submit-subscription-receipt.js');
test('subscription receipt endpoint requires an attachment',async function(){const res=await receipt.handler({httpMethod:'POST',body:'{}'});assert.equal(res.statusCode,400);});
test('subscription receipt endpoint only accepts POST',async function(){const res=await receipt.handler({httpMethod:'GET'});assert.equal(res.statusCode,405);});
