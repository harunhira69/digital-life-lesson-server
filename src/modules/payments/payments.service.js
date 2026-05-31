const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { client } = require("../../config/db");

const paymentsCollection = () =>
  client.db("digital_life_lesson").collection("payments");

const usersCollection = () =>
  client.db("digital_life_lesson").collection("users");

const createCheckoutSession = async (email, cost) => {
  const amount = parseInt(cost) * 100;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: "Digital Life Lessons Premium",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: email,
    metadata: { email },

    success_url: `${process.env.SITE_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.SITE_DOMAIN}/payment/cancel`,
  });

  return session;
};

const verifyPayment = async (sessionId) => {
  const session =
    await stripe.checkout.sessions.retrieve(sessionId);

  return session;
};

const savePayment = async (paymentData) => {
  return await paymentsCollection().insertOne(paymentData);
};

const getPaymentByTransactionId = async (
  transactionId
) => {
  return await paymentsCollection().findOne({
    transactionId,
  });
};

const upgradeUserToPremium = async (email) => {
  return await usersCollection().updateOne(
    { email },
    {
      $set: {
        isPremium: true,
        premiumSince: new Date(),
      },
    }
  );
};

const getPayments = async (query) => {
  return await paymentsCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
};

module.exports = {
  createCheckoutSession,
  verifyPayment,
  savePayment,
  getPaymentByTransactionId,
  upgradeUserToPremium,
  getPayments,
};