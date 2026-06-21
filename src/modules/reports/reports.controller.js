const reportService = require("./reports.service");

const reportLesson = async (req, res) => {
  try {
    const { lessonId, reporterEmail, reason } = req.body;

    if (!lessonId || !reporterEmail || !reason) {
      return res.status(400).send({
        success: false,
        message: "lessonId, reporterEmail and reason are required",
      });
    }

    const existingReport = await reportService.getReport({
      lessonId,
      reporterEmail,
    });

    if (existingReport) {
      return res.send({
        success: true,
        alreadyReported: true,
        message: "You already reported this lesson",
      });
    }

    const report = {
      lessonId,
      reporterEmail,
      reason,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await reportService.createReport(report);

    await reportService.updateLessonReportStatus(lessonId);

    res.send({
      success: true,
      insertedId: result.insertedId,
      message: "Lesson reported successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const checkReportStatus = async (req, res) => {
  try {
    const { lessonId, reporterEmail } = req.query;

    if (!lessonId || !reporterEmail) {
      return res.status(400).send({
        success: false,
        message: "lessonId and reporterEmail are required",
      });
    }

    const report = await reportService.getReport({
      lessonId,
      reporterEmail,
    });

    res.send({
      success: true,
      alreadyReported: !!report,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  reportLesson,
  checkReportStatus,
};