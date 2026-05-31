const express = require("express");

const router = express.Router();

const paymentController = require(
  "./payments.controller"
);

router.post(
  "/checkout-session",
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