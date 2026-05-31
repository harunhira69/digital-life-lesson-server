const commentService = require("./comments.service");

const getComments = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result =
      await commentService.getComments(
        lessonId
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const addComment = async (req, res) => {
  try {
    const {
      lessonId,
      userEmail,
      userName,
      userPhoto,
      text,
    } = req.body;

    const comment = {
      lessonId,
      userEmail,
      userName: userName || "Anonymous",
      userPhoto: userPhoto || "",
      text: text.trim(),
      createdAt: new Date(),
    };

    const result =
      await commentService.createComment(
        comment
      );

    res.send({
      insertedId: result.insertedId,
      comment,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const removeComment = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result =
      await commentService.deleteComment(
        id
      );

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getCommentCount = async (
  req,
  res
) => {
  try {
    const { lessonId } = req.params;

    const count =
      await commentService.countComments(
        lessonId
      );

    res.send({ count });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

module.exports = {
  getComments,
  addComment,
  removeComment,
  getCommentCount,
};