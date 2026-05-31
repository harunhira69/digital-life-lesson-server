const notFoundHandler = (req, res, next) => {
  res.status(404).send({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

module.exports = notFoundHandler;