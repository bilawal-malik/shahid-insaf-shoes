export class ApiError extends Error {
  constructor(status, message, code = null, fields = null, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.details = details;
  }

  static badRequest(message = 'Bad request', fields = null) {
    return new ApiError(400, message, 'VALIDATION_ERROR', fields);
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }
  static conflict(message = 'Conflict', code = 'CONFLICT', details = null) {
    return new ApiError(409, message, code, null, details);
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
