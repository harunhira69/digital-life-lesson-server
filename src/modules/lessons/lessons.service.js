const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

const lessonCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const usersCollection = () =>
  client.db("digital_life_lesson").collection("users");

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
    { _id: new ObjectId(id) },
    { $set: payload }
  );
};

const deleteLesson = async (id) => {
  return await lessonCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

const getFeaturedLessons = async () => {
  return await lessonCollection()
    .find({
      visibility: "Public",
    })
    .sort({
      likesCount: -1,
      viewsCount: -1,
      createdDate: -1,
    })
    .limit(6)
    .toArray();
};

const getMostSavedLessons = async () => {
  return await lessonCollection()
    .find({
      visibility: "Public",
    })
    .sort({
      favoritesCount: -1,
      savesCount: -1,
      createdDate: -1,
    })
    .limit(6)
    .toArray();
};

const getTopContributors = async () => {
  return await lessonCollection()
    .aggregate([
      {
        $match: {
          visibility: "Public",
        },
      },
      {
        $group: {
          _id: "$creatorEmail",
          creatorName: { $first: "$creatorName" },
          creatorPhotoUrl: { $first: "$creatorPhotoUrl" },
          totalLessons: { $sum: 1 },
          totalLikes: { $sum: "$likesCount" },
          totalFavorites: { $sum: "$favoritesCount" },
        },
      },
      {
        $sort: {
          totalLessons: -1,
          totalLikes: -1,
        },
      },
      {
        $limit: 6,
      },
    ])
    .toArray();
};

const getMyLessons = async (email) => {
  return await lessonCollection()
    .find({
      $or: [{ creatorEmail: email }, { email }],
    })
    .sort({ createdDate: -1 })
    .toArray();
};

const getRecommendedLessons = async (lesson) => {
  return await lessonCollection()
    .find({
      _id: { $ne: lesson._id },
      visibility: "Public",
      $or: [
        { category: lesson.category },
        { emotionalTone: lesson.emotionalTone },
      ],
    })
    .limit(6)
    .toArray();
};

const findUserByEmail = async (email) => {
  return await usersCollection().findOne({ email });
};

const toggleLike = async (lessonId, email) => {
  const lesson = await getLessonById(lessonId);

  if (!lesson) return null;

  const likes = lesson.likes || [];
  const alreadyLiked = likes.includes(email);

  if (alreadyLiked) {
    return await lessonCollection().updateOne(
      { _id: new ObjectId(lessonId) },
      {
        $pull: { likes: email },
        $inc: { likesCount: -1 },
      }
    );
  }

  return await lessonCollection().updateOne(
    { _id: new ObjectId(lessonId) },
    {
      $addToSet: { likes: email },
      $inc: { likesCount: 1 },
    }
  );
};

module.exports = {
  getPublicLessons,
  countLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getFeaturedLessons,
  getMostSavedLessons,
  getTopContributors,
  getMyLessons,
  getRecommendedLessons,
  findUserByEmail,
  toggleLike,
};