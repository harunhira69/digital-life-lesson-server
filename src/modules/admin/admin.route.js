const express = require("express");
const router = express.Router();

const adminController = require("./admin.controller");
const verifyAdmin = require("./admin.middleware");
const verifyToken = require("../../middleware/verifyToken");

// ================= STATS =================
router.get("/stats", verifyToken, verifyAdmin, adminController.getStats);

// ================= USERS =================
router.get("/manage-users",verifyToken, verifyAdmin, adminController.getUsers);
router.patch("/users/:id/role",verifyToken, verifyAdmin, adminController.updateUserRole);
router.delete("/users/:id",verifyToken, verifyAdmin, adminController.deleteUser);

// ================= LESSONS =================
router.get("/manage-lessons",verifyToken, verifyAdmin, adminController.getLessons);
router.patch("/lessons/:id/featured",verifyToken, verifyAdmin, adminController.toggleFeatured);
router.patch("/lessons/:id/reviewed",verifyToken, verifyAdmin, adminController.markReviewed);
router.delete("/lessons/:id",verifyToken, verifyAdmin, adminController.deleteLesson);

// ================= REPORTS =================
router.get("/reported-lessons", verifyToken,verifyAdmin, adminController.getReportedLessons);
router.patch("/lessons/:id/unflag",verifyToken, verifyAdmin, adminController.unflagLesson);

// ================= PROFILE =================
router.get("/profile",verifyToken, verifyAdmin, adminController.getProfile);
router.patch("/profile",verifyToken, verifyAdmin, adminController.updateProfile);

module.exports = router;