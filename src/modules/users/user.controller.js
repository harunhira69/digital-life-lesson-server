const userService = require("./user.service");

const createUser = async (req, res) => {
  try {
    const user = req.body;

    const existingUser =
      await userService.findUserByEmail(
        user.email
      );

    if (existingUser) {
      return res.send({
        inserted: false,
        message: "User already exists",
      });
    }

  const newUser = {
  ...user,
  role: "user",
  isPremium: false,
  createdAt: new Date(),
};

    const result =
      await userService.createUser(
        newUser
      );

    res.send({
      inserted: true,
      userId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getUserRole = async (
  req,
  res
) => {
  try {
    const { email } = req.params;

    const user =
      await userService.findUserByEmail(
        email
      );

    res.send({
      role: user?.role || "user",
      isPremium:
        user?.isPremium || false,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getSingleUser = async (
  req,
  res
) => {
  try {
    const { email } = req.params;

    const user =
      await userService.findUserByEmail(
        email
      );

    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const updateUser = async (
  req,
  res
) => {
  try {
    const { email } = req.params;

    const { name, image } =
      req.body;

    const payload = {};

    if (name) payload.name = name;
    if (image) payload.image = image;

    const result =
      await userService.updateUser(
        email,
        payload
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUserRole,
  getSingleUser,
  updateUser,
};