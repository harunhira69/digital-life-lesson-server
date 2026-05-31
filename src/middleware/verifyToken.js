const admin = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).send({
        message: "Unauthorized Access",
      });
    }

    const token =
      authorization.split(" ")[1];

    const decoded =
      await admin.auth().verifyIdToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).send({
      message: "Invalid Token",
    });
  }
};

module.exports = verifyToken;