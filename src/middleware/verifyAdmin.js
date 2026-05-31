const userService = require(
  "../modules/users/user.service"
);

const verifyAdmin = async (
  req,
  res,
  next
) => {
  try {
    const email = req.user.email;

    const user =
      await userService.findUserByEmail(
        email
      );

    if (!user || user.role !== "admin") {
      return res.status(403).send({
        message: "Forbidden Access",
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = verifyAdmin;