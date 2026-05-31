const express = require("express");

const router = express.Router();
const verifyToken = require("../../middleware/verifyToken");
const paymentController = require(
  "./payments.controller"
);

router.post(
  "/checkout-session",verifyToken,
  paymentController.createCheckoutSession
);

router.patch(
  "/verify-success-payment",
  paymentController.verifySuccessPayment
);

router.get(
  "/",
  paymentController.getPayments
);

module.exports = router;