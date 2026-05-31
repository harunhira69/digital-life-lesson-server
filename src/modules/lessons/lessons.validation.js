const { z } = require("zod");

const createLessonValidation =
  z.object({
    body: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      emotionalTone: z.string(),
      email: z.string().email(),
    }),
  });

module.exports = {
  createLessonValidation,
};