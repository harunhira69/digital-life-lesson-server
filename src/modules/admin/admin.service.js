const { ObjectId } = require("mongodb");
const { client } = require("../../config/db");

// ================= COLLECTIONS =================
const usersCollection = () =>
  client.db("digital_life_lesson").collection("users");

const lessonsCollection = () =>
  client.db("digital_life_lesson").collection("public_lesson");

const commentsCollection = () =>
  client.db("digital_life_lesson").collection("comments");

const reportsCollection = () =>
  client.db("digital_life_lesson").collection("lessonReports");

const favoritesCollection = () =>
  client.db("digital_life_lesson").collection("favorites");

// ================= STATS =================
const getAdminStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    premiumUsers,
    totalPublicLessons,
    totalPrivateLessons,
    totalLessons,
    flaggedLessons,
    todayLessons,
    totalComments,
    totalReports,
  ] = await Promise.all([
    usersCollection().countDocuments(),
    usersCollection().countDocuments({ role: "Premium" }),

    lessonsCollection().countDocuments({ visibility: "Public" }),
    lessonsCollection().countDocuments({ visibility: "Private" }),
    lessonsCollection().countDocuments(),

    lessonsCollection().countDocuments({ flagged: true }),
    lessonsCollection().countDocuments({ createdDate: { $gte: today } }),

    commentsCollection().countDocuments(),
    reportsCollection().countDocuments(),
  ]);

  const topContributors = await lessonsCollection()
    .aggregate([
      {
        $group: {
          _id: "$creatorEmail",
          name: { $first: "$creatorName" },
          photo: { $first: "$creatorPhotoUrl" },
          lessonCount: { $sum: 1 },
        },
      },
      { $sort: { lessonCount: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  return {
    totalUsers,
    premiumUsers,
    totalPublicLessons,
    totalPrivateLessons,
    totalLessons,
    flaggedLessons,
    todayLessons,
    totalComments,
    totalReports,
    topContributors,
  };
};

// ================= USERS =================
const getUsers = async (query) => {
  return await usersCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
};

const updateUserRole = async (id, role) => {
  return await usersCollection().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        role,
        isPremium: role === "Premium" || role === "admin",
      },
    }
  );
};

const deleteUser = async (id) => {
  return await usersCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

// ================= LESSONS =================
const getLessons = async (query) => {
  return await lessonsCollection()
    .find(query)
    .sort({ createdDate: -1 })
    .toArray();
};

const toggleFeatured = async (id, featured) => {
  return await lessonsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { featured } }
  );
};

const markReviewed = async (id, reviewed) => {
  return await lessonsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { reviewed } }
  );
};

const deleteLesson = async (id) => {
  await favoritesCollection().deleteMany({ lessonId: id });
  await commentsCollection().deleteMany({ lessonId: id });
  await reportsCollection().deleteMany({ lessonId: id });

  return await lessonsCollection().deleteOne({
    _id: new ObjectId(id),
  });
};

// ================= REPORTS =================
const getReportedLessons = async () => {
  return await lessonsCollection()
    .find({ flagged: true })
    .sort({ reportCount: -1 })
    .toArray();
};

const unflagLesson = async (id) => {
  await reportsCollection().deleteMany({ lessonId: id });

  return await lessonsCollection().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        flagged: false,
        reportCount: 0,
        reviewed: true,
      },
    }
  );
};

// ================= PROFILE =================
const getAdminProfile = async (email) => {
  const admin = await usersCollection().findOne({ email });

  const [lessonsModerated, totalActions] = await Promise.all([
    lessonsCollection().countDocuments({ reviewed: true }),
    reportsCollection().countDocuments(),
  ]);

  return {
    ...admin,
    lessonsModerated,
    totalActions,
  };
};

const updateProfile = async (email, updates) => {
  return await usersCollection().updateOne(
    { email },
    { $set: updates }
  );
};

// ================= EXPORT =================
module.exports = {
  getAdminStats,

  getUsers,
  updateUserRole,
  deleteUser,

  getLessons,
  toggleFeatured,
  markReviewed,
  deleteLesson,

  getReportedLessons,
  unflagLesson,

  getAdminProfile,
  updateProfile,
};