const nodemailer = require('nodemailer');
const { firebaseAdminFacade } = require('../lib/supabase');

function clean(value, max) { return String(value == null ? '' : value).trim().slice(0, max || 500); }
function esc(value) { return clean(value, 2000).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return {statusCode:405,body:JSON.stringify({ok:false,error:'Method not allowed'})};
  let data; try { data=JSON.parse(event.body||'{}'); } catch(e) { return {statusCode:400,body:JSON.stringify({ok:false,error:'Invalid request body'})}; }
  const fileBase64=clean(data.fileBase64,4000000),fileName=clean(data.fileName,180),mimeType=clean(data.mimeType,100);
  const allowed=/^(application\/pdf|image\/(png|jpe?g|webp))$/i;
  if(!fileBase64||!fileName||!allowed.test(mimeType)) return {statusCode:400,body:JSON.stringify({ok:false,error:'A PDF or image payment slip is required.'})};
  if(!/^[A-Za-z0-9+/=]+$/.test(fileBase64)||Buffer.byteLength(fileBase64,'base64')>3000000) return {statusCode:413,body:JSON.stringify({ok:false,error:'Payment slip must be smaller than 3 MB.'})};
  const user=process.env.SMTP_USER,pass=process.env.SMTP_PASS;
  if(!user||!pass) return {statusCode:500,body:JSON.stringify({ok:false,error:'Email is not configured. Set SMTP_USER and SMTP_PASS in Netlify.'})};
  const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST||'smtp.hostinger.com',port:Number(process.env.SMTP_PORT||465),secure:true,auth:{user,pass}});
  const name=clean(data.name,160)||'Customer',email=clean(data.email,320),businessName=clean(data.businessName,180),plan=clean(data.plan,30),planKey=clean(data.planKey,30),amount=clean(data.amount,80),amountLkr=Number(data.amountLkr||0),period=clean(data.period,40),billingCycle=clean(data.billingCycle,20)==='annual'?'annual':'monthly',uid=clean(data.uid,160);
  try {
    await transporter.sendMail({
      from:'"Cashflow Billing" <'+(process.env.SMTP_FROM||user)+'>',to:'accounts@ceylonrylabs.io',replyTo:email||undefined,
      subject:'Subscription bank slip · '+plan+' · '+(businessName||name),
      text:[billingCycle.charAt(0).toUpperCase()+billingCycle.slice(1)+' subscription payment slip received','Name: '+name,'Email: '+email,'Business: '+businessName,'Plan: '+plan,'Billing cycle: '+billingCycle,'Amount: '+amount,'Period: '+period].join('\n'),
      html:'<div style="font-family:Arial,sans-serif"><h2>'+esc(billingCycle.charAt(0).toUpperCase()+billingCycle.slice(1))+' subscription payment slip</h2><p><b>Name:</b> '+esc(name)+'</p><p><b>Email:</b> '+esc(email)+'</p><p><b>Business:</b> '+esc(businessName)+'</p><p><b>Plan:</b> '+esc(plan)+'</p><p><b>Billing cycle:</b> '+esc(billingCycle)+'</p><p><b>Amount:</b> '+esc(amount)+'</p><p><b>Period:</b> '+esc(period)+'</p></div>',
      attachments:[{filename:fileName.replace(/[^A-Za-z0-9._-]/g,'-'),content:fileBase64,encoding:'base64',contentType:mimeType}]
    });
    let adminStored=false;
    try {
      const admin=firebaseAdminFacade(),stamp=admin.firestore.FieldValue.serverTimestamp();
      const receiptId=(uid||email.replace(/[^a-z0-9]/gi,'-')||'receipt')+'-'+(period||Date.now());
      await admin.firestore().collection('subscriptionPayments').doc(receiptId).set({uid,email,name,businessName,plan:planKey||plan,billingCycle,amountLkr:Number.isFinite(amountLkr)?amountLkr:0,currency:'LKR',period,status:'receipt-submitted',source:'bank-receipt-email',receiptName:fileName,emailRecipient:'accounts@ceylonrylabs.io',emailSent:true,receivedAt:stamp,receivedAtUtc:new Date().toISOString()},{merge:true});
      adminStored=true;
    } catch(storageError) { console.warn('Subscription receipt admin record failed:',storageError&&storageError.message); }
    return {statusCode:200,body:JSON.stringify({ok:true,sent:true,adminStored})};
  } catch(error) { return {statusCode:502,body:JSON.stringify({ok:false,error:'Could not email the payment slip: '+clean(error&&error.message,260)})}; }
};
