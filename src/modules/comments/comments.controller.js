const commentService = require("./comments.service");

const getComments = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const result = await commentService.getComments(lessonId);

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
      comment,
    } = req.body;

    const finalText = text || comment;

    if (!lessonId || !userEmail || !finalText?.trim()) {
      return res.status(400).send({
        message: "lessonId, userEmail and text/comment are required",
      });
    }

    const newComment = {
      lessonId,
      userEmail,
      userName: userName || "Anonymous",
      userPhoto: userPhoto || "",
      text: finalText.trim(),
      createdAt: new Date(),
    };

    const result = await commentService.createComment(newComment);

    res.send({
      insertedId: result.insertedId,
      comment: {
        _id: result.insertedId,
        ...newComment,
      },
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const removeComment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await commentService.deleteComment(id);

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};

const getCommentCount = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const count = await commentService.countComments(lessonId);

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