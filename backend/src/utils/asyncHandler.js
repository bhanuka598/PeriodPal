// Simple wrapper to avoid try/catch in every controller
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // Set default status code if not provided
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
  };
};
