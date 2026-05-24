const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    return res.status(statusCode).json({ message, stack: err.stack });
  }

  return res.status(statusCode).json({ message });
};

module.exports = errorHandler;
