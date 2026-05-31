const ApiError = require("../utils/apiError");

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // MongoDB Cast Error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Mongo duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value";
  }

  // Zod validation error (optional support)
  if (err.errors) {
    statusCode = 400;
    message = "Validation Error";
  }

  res.status(statusCode).send({
    success: false,
    message,
    ...(err.details && { details: err.details }),
  });
};

module.exports = globalErrorHandler;