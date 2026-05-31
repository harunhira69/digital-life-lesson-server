const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

const lessonCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const getPublicLessons = async (query, options) => {
  return await lessonCollection()
    .find(query)
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit)
    .toArray();
};

const countLessons = async (query) => {
  return await lessonCollection().countDocuments(query);
};

const getLessonById = async (id) => {
  return await lessonCollection().findOne({
    _id: new ObjectId(id),
  });
};

const createLesson = async (payload) => {
  return await lessonCollection().insertOne(payload);
};

const updateLesson = async (id, payload) => {
  return await lessonCollection().updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: payload,
    }
  );
};

const deleteLesson = async (id) => {
  return await lessonCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

module.exports = {
  getPublicLessons,
  countLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
};