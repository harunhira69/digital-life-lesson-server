const express = require("express");
const router = express.Router();

// ─── Modules Routes ─────────────────────────────
const lessonsRoutes = require("../modules/lessons/lessons.route");
const usersRoutes = require("../modules/users/user.route");
const paymentsRoutes = require("../modules/payments/payments.route");
const favoritesRoutes = require("../modules/favorites/favorites.route");
const commentsRoutes = require("../modules/comments/comments.route");
const reportsRoutes = require("../modules/reports/reports.route");
const dashboardRoutes = require("../modules/dashboard/dashboard.route");
const adminRoutes = require("../modules/admin/admin.route");

// ─── Route Binding ──────────────────────────────
router.use("/lessons", lessonsRoutes);
router.use("/users", usersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/comments", commentsRoutes);
router.use("/reports", reportsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);

// ─── 404 fallback (optional clean API response)
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

module.exports = router;