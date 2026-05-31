const { z } = require("zod");

const createUserValidation =
  z.object({
    body: z.object({
      name: z.string(),
      email: z.string().email(),
      image: z.string().optional(),
    }),
  });

const updateUserValidation =
  z.object({
    body: z.object({
      name: z.string().optional(),
      image: z.string().optional(),
    }),
  });

module.exports = {
  createUserValidation,
  updateUserValidation,
};