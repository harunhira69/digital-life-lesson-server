const paymentService = require("./payments.service");

const createCheckoutSession = async (req, res) => {
  try {
    const { email, cost = 1500 } = req.body;

    if (!email) {
      return res.status(400).send({
        message: "Email required",
      });
    }

    const session = await paymentService.createCheckoutSession(email, cost);

    res.send({
      url: session.url,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const verifySuccessPayment = async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).send({
        success: false,
        message: "session_id missing",
      });
    }

    const session = await paymentService.verifyPayment(sessionId);

    if (session.payment_status !== "paid") {
      return res.send({
        success: false,
        message: "Payment not completed",
      });
    }

    const transactionId = session.payment_intent;
    const customerEmail = session.customer_email || session.metadata?.email;

    if (!transactionId || !customerEmail) {
      return res.status(400).send({
        success: false,
        message: "Invalid payment session data",
      });
    }

    const existing = await paymentService.getPaymentByTransactionId(transactionId);

    if (existing) {
      await paymentService.upgradeUserToPremium(customerEmail);

      return res.send({
        success: true,
        message: "Payment already verified",
        transactionId: existing.transactionId,
        trackingId: existing._id,
      });
    }

    const paymentDoc = {
      email: customerEmail,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: session.payment_status,
      transactionId,
      sessionId,
      createdAt: new Date(),
    };

    let savedPayment;

    try {
      savedPayment = await paymentService.savePayment(paymentDoc);
    } catch (error) {
      if (error.code === 11000) {
        const duplicatePayment =
          await paymentService.getPaymentByTransactionId(transactionId);

        await paymentService.upgradeUserToPremium(customerEmail);

        return res.send({
          success: true,
          message: "Payment already saved",
          transactionId,
          trackingId: duplicatePayment?._id,
        });
      }

      throw error;
    }

    await paymentService.upgradeUserToPremium(customerEmail);

    res.send({
      success: true,
      message: "Payment verified successfully",
      transactionId,
      trackingId: savedPayment.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const { email } = req.query;

    const query = email ? { email } : {};

    const result = await paymentService.getPayments(query);

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