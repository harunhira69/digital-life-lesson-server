const express = require("express");

const router = express.Router();

const userController = require(
  "./user.controller"
);

router.post(
  "/",
  userController.createUser
);

router.get(
  "/role/:email",
  userController.getUserRole
);

router.get(
  "/:email",
  userController.getSingleUser
);

router.patch(
  "/:email",
  userController.updateUser
);

module.exports = router;