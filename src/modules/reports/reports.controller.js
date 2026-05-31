const reportService = require("./reports.service");

const reportLesson = async (
  req,
  res
) => {
  try {
    const {
      lessonId,
      reporterEmail,
      reason,
    } = req.body;

    const existingReport =
      await reportService.getReport({
        lessonId,
        reporterEmail,
      });

    if (existingReport) {
      return res.send({
        alreadyReported: true,
        message:
          "You already reported this lesson",
      });
    }

    const report = {
      lessonId,
      reporterEmail,
      reason,
      createdAt: new Date(),
    };

    await reportService.createReport(
      report
    );

    await reportService.updateLessonReportStatus(
      lessonId
    );

    res.send({
      success: true,
      message:
        "Lesson reported successfully",
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const checkReportStatus = async (
  req,
  res
) => {
  try {
    const {
      lessonId,
      reporterEmail,
    } = req.query;

    const report =
      await reportService.getReport({
        lessonId,
        reporterEmail,
      });

    res.send({
      alreadyReported: !!report,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  reportLesson,
  checkReportStatus,
};