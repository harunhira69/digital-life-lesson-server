const express = require("express");
const router = express.Router();

const commentController = require("./comments.controller");

router.get("/count/:lessonId", commentController.getCommentCount);

router.get("/:lessonId", commentController.getComments);

router.post("/", commentController.addComment);

router.delete("/:id", commentController.removeComment);

module.exports = router;