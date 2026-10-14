'use strict';

// Which Ceylonry products a POS account uses, for the admin accounts list. POS is every account on that list; Guest Manager (GM)
// and the Kitchen Display (KDS) count when their feature switch is on (for the business or for any location) and the assigned plan
// does not exclude it. KDS also needs the kitchen tickets and open orders it builds on.
const GM = 'view.guestManager', KDS = 'checkout.kds';

function appsUsed(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  const features = s.features || {};
  const off = s.subscription && s.subscription.enforced ? s.subscription.featuresOff || [] : [];
  const on = function(id) {
    if (off.indexOf(id) !== -1) return false;
    return features[id] === true || Object.keys(s.locationFeatures || {}).some(function(loc) { return (s.locationFeatures[loc] || {})[id] === true; });
  };
  const apps = ['POS'];
  if (on(GM)) apps.push('GM');
  if (on(KDS) && features['checkout.kitchenTickets'] !== false && features['checkout.openOrders'] !== false && off.indexOf('checkout.kitchenTickets') === -1 && off.indexOf('checkout.openOrders') === -1) apps.push('KDS');
  return apps;
}

module.exports = { appsUsed };
