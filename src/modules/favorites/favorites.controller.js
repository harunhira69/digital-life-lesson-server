const { ObjectId } = require("mongodb");
const favoriteService = require("./favorites.service");

const getFavorites = async (req, res) => {
  try {
    const {
      email,
      category,
      emotionalTone,
    } = req.query;

    if (!email) {
      return res.status(400).send({
        message: "Email required",
      });
    }

    const query = {
      userEmail: email,
    };

    if (category) {
      query.category = category;
    }

    if (emotionalTone) {
      query.emotionalTone = emotionalTone;
    }

    const result =
      await favoriteService.getFavorites(
        query
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const checkFavorite = async (
  req,
  res
) => {
  try {
    const {
      lessonId,
      userEmail,
    } = req.query;

    const favorite =
      await favoriteService.getFavorite({
        lessonId,
        userEmail,
      });

    res.send({
      isFavorite: !!favorite,
      favoriteId:
        favorite?._id || null,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const addFavorite = async (
  req,
  res
) => {
  try {
    const { lessonId, userEmail } =
      req.body;

    const lesson =
      await favoriteService.getLessonById(
        lessonId
      );

    if (!lesson) {
      return res.status(404).send({
        message: "Lesson not found",
      });
    }

    const existing =
      await favoriteService.getFavorite({
        lessonId,
        userEmail,
      });

    if (existing) {
      return res.send({
        isFavorite: true,
        message:
          "Already added to favorites",
      });
    }

    const favoriteDoc = {
      lessonId,
      userEmail,
      title: lesson.title,
      category: lesson.category,
      emotionalTone:
        lesson.emotionalTone,
      accessLevel:
        lesson.accessLevel,
      imageUrl:
        lesson.imageUrl || "",
      creatorName:
        lesson.creatorName || "",
      createdAt: new Date(),
    };

    const result =
      await favoriteService.createFavorite(
        favoriteDoc
      );

    await favoriteService.increaseSaveCount(
      lessonId
    );

    res.send({
      insertedId:
        result.insertedId,
      message:
        "Added to favorites",
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const removeFavoriteById =
  async (req, res) => {
    try {
      const { id } = req.params;

      const favorite =
        await favoriteService.getFavorite({
          _id: new ObjectId(id),
        });

      if (
        favorite &&
        favorite.lessonId
      ) {
        await favoriteService.decreaseSaveCount(
          favorite.lessonId
        );
      }

      const result =
        await favoriteService.deleteFavoriteById(
          id
        );

      res.send(result);
    } catch (error) {
      res.status(500).send({
        message: error.message,
      });
    }
  };

const removeFavorite = async (
  req,
  res
) => {
  try {
    const {
      lessonId,
      userEmail,
    } = req.query;

    const favorite =
      await favoriteService.getFavorite({
        lessonId,
        userEmail,
      });

    if (!favorite) {
      return res.status(404).send({
        message:
          "Favorite not found",
      });
    }

    await favoriteService.decreaseSaveCount(
      lessonId
    );

    const result =
      await favoriteService.deleteFavorite(
        {
          lessonId,
          userEmail,
        }
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  getFavorites,
  checkFavorite,
  addFavorite,
  removeFavoriteById,
  removeFavorite,
};