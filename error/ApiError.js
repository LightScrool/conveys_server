class ApiError extends Error {
  constructor(status, message) {
    super();
    this.status = status;
    this.message = message;
  }

  static badRequest(message = "Bar request!") {
    return new ApiError(400, message);
  }

  static unauthorized(message = "This action requires authorization!") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Lack of right to perform this action!") {
    return new ApiError(403, message);
  }

  static notFound(message = "Data not found!") {
    return new ApiError(404, message);
  }

  static internal(message = "Internal server error!") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
