const express = require("express");

const router =
  express.Router();

const dashboardController =
  require("./dashboard.controller");

router.get(
  "/stats",
  dashboardController.dashboardStats
);

router.get(
  "/weekly-stats",
  dashboardController.weeklyStats
);

module.exports = router;