const dashboardService = require(
  "./dashboard.service"
);

const dashboardStats = async (
  req,
  res
) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message:
          "Email is required",
      });
    }

    const result =
      await dashboardService.getDashboardStats(
        email
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const weeklyStats = async (
  req,
  res
) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).send({
        message:
          "Email is required",
      });
    }

    const result =
      await dashboardService.getWeeklyStats(
        email
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  dashboardStats,
  weeklyStats,
};