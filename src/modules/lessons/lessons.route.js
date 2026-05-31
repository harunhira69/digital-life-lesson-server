const express = require("express");

const router = express.Router();

const lessonController = require(
  "./lessons.controller"
);

const verifyToken = require(
  "../../middleware/verifyToken"
);

router.get(
  "/public-lessons",
  lessonController.getPublicLessons
);

router.get(
  "/my-lessons",
  verifyToken,
  lessonController.getMyLessons
);

router.patch(
  "/like/:id",
  verifyToken,
  lessonController.likeLesson
);

router.get(
  "/similar/:id",
  lessonController.getSimilarLessons
);

router.get(
  "/:id",
  lessonController.getLessonById
);

router.post(
  "/",
  verifyToken,
  lessonController.createLesson
);

router.patch(
  "/:id",
  verifyToken,
  lessonController.updateLesson
);

router.delete(
  "/:id",
  verifyToken,
  lessonController.deleteLesson
);

module.exports = router;