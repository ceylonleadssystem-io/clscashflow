const test=require('node:test');const assert=require('node:assert/strict');
const receipt=require('../netlify/functions/submit-subscription-receipt.js');
test('subscription receipt endpoint requires sign-in before accepting an attachment',async function(){const res=await receipt.handler({httpMethod:'POST',body:'{}'});assert.equal(res.statusCode,401);});
test('subscription receipt endpoint only accepts POST',async function(){const res=await receipt.handler({httpMethod:'GET'});assert.equal(res.statusCode,405);});
test('POS plan resolves to the account tier; CashFlow plans are untouched',function(){const t=receipt._test;
assert.deepEqual([t.POS_PLANS.starter.monthly,t.POS_PLANS.business.monthly,t.POS_PLANS.pro.monthly],[5500,7500,15500]);
assert.deepEqual([t.POS_PLANS.starter.annual,t.POS_PLANS.business.annual,t.POS_PLANS.pro.annual],[62000,83000,180000]);
assert.equal(t.resolvePlan('pos','business').plan.monthly,7500);assert.equal(t.resolvePlan('pos','').plan.monthly,5500);assert.equal(t.resolvePlan('pos','nonsense').plan.monthly,5500);
// CashFlow resolution is exactly what it was before POS tiers existed.
assert.equal(t.resolvePlan('studio').plan.monthly,7500);assert.equal(t.resolvePlan('business').plan.monthly,15500);assert.equal(t.resolvePlan('business').plan.annual,180000);
assert.equal(t.resolvePlan('starter').planKey,'studio');assert.equal(t.resolvePlan('premium').planKey,'business');assert.equal(t.resolvePlan('solo').plan,undefined);});
