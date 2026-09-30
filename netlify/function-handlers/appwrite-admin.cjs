const { firebaseAdminFacade } = require('../lib/appwrite');

async function getAdmin() {
  return firebaseAdminFacade();
}

module.exports = { getAdmin };