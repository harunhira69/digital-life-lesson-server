const express = require("express");
const router = express.Router();

const reportController = require("./reports.controller");

router.post("/", reportController.reportLesson);

router.get("/check", reportController.checkReportStatus);

module.exports = router;