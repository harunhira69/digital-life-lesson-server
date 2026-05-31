const { z } = require("zod");

const emailQueryValidation =
  z.object({
    query: z.object({
      email: z
        .string()
        .email(),
    }),
  });

module.exports = {
  emailQueryValidation,
};