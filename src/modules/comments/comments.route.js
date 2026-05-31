const express = require("express");

const router = express.Router();

const commentController = require(
  "./comments.controller"
);

router.get(
  "/:lessonId",
  commentController.getComments
);

router.post(
  "/",
  commentController.addComment
);

router.delete(
  "/:id",
  commentController.removeComment
);

router.get(
  "/count/:lessonId",
  commentController.getCommentCount
);

module.exports = router;