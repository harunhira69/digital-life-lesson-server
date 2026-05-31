const { z } = require("zod");

const reportValidation =
  z.object({
    body: z.object({
      lessonId: z.string(),
      reporterEmail: z
        .string()
        .email(),
      reason: z.string().min(3),
    }),
  });

module.exports = {
  reportValidation,
};