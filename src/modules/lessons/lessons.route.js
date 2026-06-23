const express = require("express");
const router = express.Router();

const lessonController = require("./lessons.controller");

// Special routes must come before "/:id"
router.get(
  "/public-lessons",
  lessonController.getPublicLessons
);

router.get(
  "/featured-lessons",
  lessonController.getFeaturedLessons
);

router.get(
  "/top-contributors",
  lessonController.getTopContributors
);

router.get(
  "/most-saved-lessons",
  lessonController.getMostSavedLessons
);

// Dynamic id route must stay after special routes
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