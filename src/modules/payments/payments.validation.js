const { z } = require("zod");

const createCheckoutValidation =
  z.object({
    body: z.object({
      email: z.string().email(),
      cost: z.number().optional(),
    }),
  });

module.exports = {
  createCheckoutValidation,
};