const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

const commentsCollection = () =>
  client.db("digital_life_lesson").collection("comments");

const getComments = async (lessonId) => {
  return await commentsCollection()
    .find({ lessonId })
    .sort({ createdAt: -1 })
    .toArray();
};

const createComment = async (payload) => {
  return await commentsCollection().insertOne(
    payload
  );
};

const deleteComment = async (id) => {
  return await commentsCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

const countComments = async (lessonId) => {
  return await commentsCollection().countDocuments({
    lessonId,
  });
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  countComments,
};