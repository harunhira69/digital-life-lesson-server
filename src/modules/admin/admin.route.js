const express = require("express");
const router = express.Router();

const adminController = require("./admin.controller");
const verifyAdmin = require("./admin.middleware");

// ================= STATS =================
router.get("/stats", verifyAdmin, adminController.getStats);

// ================= USERS =================
router.get("/manage-users", verifyAdmin, adminController.getUsers);
router.patch("/users/:id/role", verifyAdmin, adminController.updateUserRole);
router.delete("/users/:id", verifyAdmin, adminController.deleteUser);

// ================= LESSONS =================
router.get("/manage-lessons", verifyAdmin, adminController.getLessons);
router.patch("/lessons/:id/featured", verifyAdmin, adminController.toggleFeatured);
router.patch("/lessons/:id/reviewed", verifyAdmin, adminController.markReviewed);
router.delete("/lessons/:id", verifyAdmin, adminController.deleteLesson);

// ================= REPORTS =================
router.get("/reported-lessons", verifyAdmin, adminController.getReportedLessons);
router.patch("/lessons/:id/unflag", verifyAdmin, adminController.unflagLesson);

// ================= PROFILE =================
router.get("/profile", verifyAdmin, adminController.getProfile);
router.patch("/profile", verifyAdmin, adminController.updateProfile);

module.exports = router;