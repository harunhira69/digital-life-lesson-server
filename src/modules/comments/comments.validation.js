const { z } = require("zod");

const createCommentValidation =
  z.object({
    body: z.object({
      lessonId: z.string(),
      userEmail: z.string().email(),
      userName: z.string().optional(),
      userPhoto: z.string().optional(),
      text: z.string().min(1),
    }),
  });

module.exports = {
  createCommentValidation,
};