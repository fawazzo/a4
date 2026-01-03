// backend/middleware/errorMiddleware.js

// Middleware to handle 404 (Not Found) errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the general error handler
};

// General error handling middleware
const errorHandler = (err, req, res, next) => {
  // Sometimes Express sets the status to 200 even if an error occurred.
  // We ensure it's an error status code.
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Only include stack trace if in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };