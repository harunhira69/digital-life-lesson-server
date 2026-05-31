const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

const reportsCollection = () =>
  client.db("digital_life_lesson").collection("lessonReports");

const lessonsCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const getReport = async (query) => {
  return await reportsCollection().findOne(query);
};

const createReport = async (payload) => {
  return await reportsCollection().insertOne(
    payload
  );
};

const updateLessonReportStatus = async (
  lessonId
) => {
  return await lessonsCollection().updateOne(
    {
      _id: new ObjectId(lessonId),
    },
    {
      $set: {
        flagged: true,
      },
      $inc: {
        reportCount: 1,
      },
    }
  );
};

module.exports = {
  getReport,
  createReport,
  updateLessonReportStatus,
};