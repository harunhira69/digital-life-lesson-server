const { z } = require("zod");

const updateRoleValidation = z.object({
  body: z.object({
    role: z.enum(["Free", "Premium", "admin"]),
  }),
});

const reviewValidation = z.object({
  body: z.object({
    reviewed: z.boolean().optional(),
  }),
});

const profileValidation = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().optional(),
    image: z.string().optional(),
  }),
});

module.exports = {
  updateRoleValidation,
  reviewValidation,
  profileValidation,
};