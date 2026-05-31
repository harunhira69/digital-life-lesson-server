const admin = require("firebase-admin");

const serviceAccount = require("../../firebase-jwt-secret-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;