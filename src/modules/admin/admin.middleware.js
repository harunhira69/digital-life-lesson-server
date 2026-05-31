const { client } = require("../../config/db");

const usersCollection = () =>
  client.db("digital_life_lesson").collection("users");

const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.query.email || req.body.email;

    if (!email) {
      return res.status(401).send({ message: "Email required" });
    }

    const user = await usersCollection().findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "Access denied" });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).send({ message: "Admin verification failed" });
  }
};

module.exports = verifyAdmin;