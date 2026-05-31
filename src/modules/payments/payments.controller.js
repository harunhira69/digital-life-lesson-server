const paymentService = require("./payments.service");

const createCheckoutSession = async (
  req,
  res
) => {
  try {
    const { email, cost = 1500 } = req.body;

    if (!email) {
      return res.status(400).send({
        message: "Email required",
      });
    }

    const session =
      await paymentService.createCheckoutSession(
        email,
        cost
      );

    res.send({
      url: session.url,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const verifySuccessPayment = async (
  req,
  res
) => {
  try {
    const sessionId =
      req.query.session_id;

    if (!sessionId) {
      return res.status(400).send({
        message: "session_id missing",
      });
    }

    const session =
      await paymentService.verifyPayment(
        sessionId
      );

    if (
      session.payment_status !== "paid"
    ) {
      return res.send({
        success: false,
        message: "Payment not completed",
      });
    }

    const transactionId =
      session.payment_intent;

    const existing =
      await paymentService.getPaymentByTransactionId(
        transactionId
      );

    if (existing) {
      return res.send({
        success: true,
        transactionId,
      });
    }

    const customerEmail =
      session.customer_email ||
      session.metadata?.email;

    const paymentDoc = {
      email: customerEmail,
      amount:
        session.amount_total / 100,
      currency: session.currency,
      paymentStatus:
        session.payment_status,
      transactionId,
      sessionId,
      createdAt: new Date(),
    };

    await paymentService.savePayment(
      paymentDoc
    );

    await paymentService.upgradeUserToPremium(
      customerEmail
    );

    res.send({
      success: true,
      transactionId,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getPayments = async (
  req,
  res
) => {
  try {
    const { email } = req.query;

    const query = email
      ? { email }
      : {};

    const result =
      await paymentService.getPayments(
        query
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  createCheckoutSession,
  verifySuccessPayment,
  getPayments,
};