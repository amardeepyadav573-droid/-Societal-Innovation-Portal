export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  let statusCode = error.statusCode || 500;
  let message = error.publicMessage || error.message || "Internal server error";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "A record with this information already exists.";
  }

  if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
    statusCode = 503;
    message = "An external service is temporarily unavailable. Please try again shortly.";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID or data format.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development"
      ? { stack: error.stack }
      : {})
  });
};