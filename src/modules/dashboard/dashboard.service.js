const { client } = require("../../config/db");

const lessonsCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const favoritesCollection = () =>
  client.db("digital_life_lesson").collection("favorites");

const getDashboardStats = async (email) => {
  const [
    totalLessons,
    publicLessons,
    privateLessons,
    favorites,
    recentLessons,
    totalLikes,
    totalSaves,
  ] = await Promise.all([
    lessonsCollection().countDocuments({
      creatorEmail: email,
    }),

    lessonsCollection().countDocuments({
      creatorEmail: email,
      visibility: "Public",
    }),

    lessonsCollection().countDocuments({
      creatorEmail: email,
      visibility: "Private",
    }),

    favoritesCollection().countDocuments({
      userEmail: email,
    }),

    lessonsCollection()
      .find({
        creatorEmail: email,
      })
      .sort({
        createdDate: -1,
      })
      .limit(5)
      .toArray(),

    lessonsCollection()
      .aggregate([
        {
          $match: {
            creatorEmail: email,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$likesCount",
            },
          },
        },
      ])
      .toArray(),

    lessonsCollection()
      .aggregate([
        {
          $match: {
            creatorEmail: email,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$savesCount",
            },
          },
        },
      ])
      .toArray(),
  ]);

  return {
    totalLessons,
    publicLessons,
    privateLessons,
    favorites,
    recentLessons,
    totalLikes: totalLikes[0]?.total || 0,
    totalSaves: totalSaves[0]?.total || 0,
  };
};

const getWeeklyStats = async (email) => {
  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 6
  );

  sevenDaysAgo.setHours(
    0,
    0,
    0,
    0
  );

  const raw =
    await lessonsCollection()
      .aggregate([
        {
          $match: {
            creatorEmail: email,
            createdDate: {
              $gte: sevenDaysAgo,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdDate",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();

  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setDate(
      date.getDate() - i
    );

    const key = date
      .toISOString()
      .split("T")[0];

    const day =
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        }
      );

    const found = raw.find(
      (item) => item._id === key
    );

    result.push({
      date: key,
      day,
      count: found
        ? found.count
        : 0,
    });
  }

  return result;
};

module.exports = {
  getDashboardStats,
  getWeeklyStats,
};