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
const getLessonsByEmail = async (
  email
) => {
  return await lessonCollection()
    .find({
      creatorEmail: email,
    })
    .sort({
      createdDate: -1,
    })
    .toArray();
};

const toggleLike = async (
  lessonId,
  userEmail
) => {
  const lesson =
    await lessonCollection().findOne({
      _id: new ObjectId(lessonId),
    });

  if (!lesson) return null;

  const likes = lesson.likes || [];

  const alreadyLiked =
    likes.includes(userEmail);

  if (alreadyLiked) {
    return await lessonCollection().updateOne(
      {
        _id: new ObjectId(lessonId),
      },
      {
        $pull: {
          likes: userEmail,
        },
        $inc: {
          likesCount: -1,
        },
      }
    );
  }

  return await lessonCollection().updateOne(
    {
      _id: new ObjectId(lessonId),
    },
    {
      $addToSet: {
        likes: userEmail,
      },
      $inc: {
        likesCount: 1,
      },
    }
  );
};

const getSimilarLessons = async (
  category,
  emotionalTone,
  currentId
) => {
  return await lessonCollection()
    .find({
      _id: {
        $ne: new ObjectId(currentId),
      },
      visibility: "Public",
      $or: [
        { category },
        { emotionalTone },
      ],
    })
    .limit(6)
    .toArray();
};

module.exports = {
  getPublicLessons,
  countLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonsByEmail,
toggleLike,
getSimilarLessons,
};