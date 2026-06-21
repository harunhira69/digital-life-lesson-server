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

    const query = { visibility: "Public" };

    if (category && category !== "All") query.category = category;
    if (emotionalTone && emotionalTone !== "All") query.emotionalTone = emotionalTone;
    if (accessLevel && accessLevel !== "All") query.accessLevel = accessLevel;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdDate: -1 };

    if (sort === "oldest") sortOption = { createdDate: 1 };
    if (sort === "mostLiked") sortOption = { likesCount: -1 };
    if (sort === "mostSaved") {
      sortOption = {
        favoritesCount: -1,
        savesCount: -1,
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lessons = await lessonService.getPublicLessons(query, {
      sort: sortOption,
      skip,
      limit: parseInt(limit),
    });

    const total = await lessonService.countLessons(query);

    res.send({
      lessons,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getLessonById = async (req, res) => {
  try {
    const lesson = await lessonService.getLessonById(req.params.id);

    if (!lesson) {
      return res.status(404).send({
        message: "Lesson not found",
      });
    }

    res.send(lesson);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const createLesson = async (req, res) => {
  try {
    const creatorEmail = req.body.creatorEmail || req.body.email;

    if (!creatorEmail) {
      return res.status(400).send({
        message: "creatorEmail or email is required",
      });
    }

    const dbUser = await lessonService.findUserByEmail(creatorEmail);

    if (req.body.accessLevel === "Premium" && !dbUser?.isPremium && dbUser?.role !== "Premium") {
      return res.status(403).send({
        message: "Only premium users can create premium lessons",
      });
    }

    const lesson = {
      ...req.body,
      creatorEmail,
      creatorName: req.body.creatorName || dbUser?.name || "Anonymous",
      creatorPhotoUrl:
        req.body.creatorPhotoUrl || req.body.image || dbUser?.image || "",
      likes: [],
      likesCount: 0,
      savesCount: req.body.savesCount || 0,
      favoritesCount: req.body.favoritesCount || 0,
      viewsCount: req.body.viewsCount || Math.floor(Math.random() * 10000),
      reportCount: 0,
      flagged: false,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    const result = await lessonService.createLesson(lesson);

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const updateLesson = async (req, res) => {
  try {
    const result = await lessonService.updateLesson(req.params.id, {
      ...req.body,
      updatedDate: new Date(),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const result = await lessonService.deleteLesson(req.params.id);

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getFeaturedLessons = async (req, res) => {
  try {
    const result = await lessonService.getFeaturedLessons();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getMostSavedLessons = async (req, res) => {
  try {
    const result = await lessonService.getMostSavedLessons();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getTopContributors = async (req, res) => {
  try {
    const result = await lessonService.getTopContributors();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getMyLessons = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await lessonService.getMyLessons(email);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const getRecommendedLessons = async (req, res) => {
  try {
    const lesson = await lessonService.getLessonById(req.params.id);

    if (!lesson) {
      return res.status(404).send({
        message: "Lesson not found",
      });
    }

    const result = await lessonService.getRecommendedLessons(lesson);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        message: "Email is required",
      });
    }

    const result = await lessonService.toggleLike(req.params.id, email);

    if (!result) {
      return res.status(404).send({
        message: "Lesson not found",
      });
    }

    res.send({
      success: true,
      message: "Like updated",
      result,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getPublicLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getFeaturedLessons,
  getMostSavedLessons,
  getTopContributors,
  getMyLessons,
  getRecommendedLessons,
  toggleLike,
};