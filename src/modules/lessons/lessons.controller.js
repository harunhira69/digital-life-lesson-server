const userService = require("../users/user.service");
const lessonService = require("./lessons.service");

const getPublicLessons = async (req, res) => {
  try {
    const {
      category,
      emotionalTone,
      search,
      accessLevel,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {
      visibility: "Public",
    };

    if (category) query.category = category;
    if (emotionalTone) query.emotionalTone = emotionalTone;
    if (accessLevel) query.accessLevel = accessLevel;

    if (search) {
      query.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    let sortOption = {
      createdDate: -1,
    };

    if (sort === "oldest") {
      sortOption = { createdDate: 1 };
    }

    if (sort === "mostLiked") {
      sortOption = { likesCount: -1 };
    }

    const skip =
      (parseInt(page) - 1) * parseInt(limit);

    const lessons =
      await lessonService.getPublicLessons(
        query,
        {
          sort: sortOption,
          skip,
          limit: parseInt(limit),
        }
      );

    const total =
      await lessonService.countLessons(query);

    res.send({
      lessons,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(
        total / parseInt(limit)
      ),
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getLessonById = async (req, res) => {
  try {
    const lesson =
      await lessonService.getLessonById(
        req.params.id
      );

    if (!lesson) {
      return res.status(404).send({
        message: "Lesson not found",
      });
    }

    res.send(lesson);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const createLesson = async (req, res) => {
  try {
    const user =
      await userService.findUserByEmail(
        req.user.email
      );

    if (
      req.body.accessLevel === "Premium" &&
      !user?.isPremium
    ) {
      return res.status(403).send({
        message:
          "Upgrade to Premium first",
      });
    }

    const lesson = {
      ...req.body,
      creatorEmail: req.user.email,
      likes: [],
      likesCount: 0,
      savesCount: 0,
      viewsCount: 0,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    const result =
      await lessonService.createLesson(
        lesson
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const updateLesson = async (req, res) => {
  try {
    const result =
      await lessonService.updateLesson(
        req.params.id,
        {
          ...req.body,
          updatedDate: new Date(),
        }
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const result =
      await lessonService.deleteLesson(
        req.params.id
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};
const getMyLessons = async (
  req,
  res
) => {
  try {
    const result =
      await lessonService.getLessonsByEmail(
        req.user.email
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const likeLesson = async (
  req,
  res
) => {
  try {
    const result =
      await lessonService.toggleLike(
        req.params.id,
        req.user.email
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getSimilarLessons = async (
  req,
  res
) => {
  try {
    const lesson =
      await lessonService.getLessonById(
        req.params.id
      );

    const result =
      await lessonService.getSimilarLessons(
        lesson.category,
        lesson.emotionalTone,
        lesson._id
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  getPublicLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getMyLessons,
likeLesson,
getSimilarLessons,
};