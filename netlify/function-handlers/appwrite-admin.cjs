const { appwriteAdmin } = require('../lib/appwrite');

async function getAdmin() {
  return appwriteAdmin();
}

module.exports = { getAdmin };