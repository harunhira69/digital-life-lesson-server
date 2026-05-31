const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

const favoritesCollection = () =>
  client.db("digital_life_lesson").collection("favorites");

const lessonsCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const getFavorites = async (query) => {
  return await favoritesCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
};

const getFavorite = async (query) => {
  return await favoritesCollection().findOne(query);
};

const createFavorite = async (payload) => {
  return await favoritesCollection().insertOne(payload);
};

const deleteFavoriteById = async (id) => {
  return await favoritesCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

const deleteFavorite = async (query) => {
  return await favoritesCollection().deleteOne(query);
};

const getLessonById = async (id) => {
  return await lessonsCollection().findOne({
    _id: new ObjectId(id),
  });
};

const increaseSaveCount = async (lessonId) => {
  return await lessonsCollection().updateOne(
    {
      _id: new ObjectId(lessonId),
    },
    {
      $inc: {
        savesCount: 1,
      },
    }
  );
};

const decreaseSaveCount = async (lessonId) => {
  return await lessonsCollection().updateOne(
    {
      _id: new ObjectId(lessonId),
    },
    {
      $inc: {
        savesCount: -1,
      },
    }
  );
};

module.exports = {
  getFavorites,
  getFavorite,
  createFavorite,
  deleteFavoriteById,
  deleteFavorite,
  getLessonById,
  increaseSaveCount,
  decreaseSaveCount,
};