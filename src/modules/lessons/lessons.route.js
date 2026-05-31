const express = require("express");

const router = express.Router();

const lessonController = require("./lessons.controller");

router.get(
  "/public-lessons",
  lessonController.getPublicLessons
);

router.get(
  "/:id",
  lessonController.getLessonById
);

router.post(
  "/",
  lessonController.createLesson
);

router.patch(
  "/:id",
  lessonController.updateLesson
);

router.delete(
  "/:id",
  lessonController.deleteLesson
);

module.exports = router;