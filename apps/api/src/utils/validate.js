import { ApiError } from './apiError.js';

/** Validates req[source] against a zod schema; replaces it with parsed data. */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || source;
        if (!fields[key]) fields[key] = issue.message;
      }
      return next(ApiError.badRequest('Validation failed', fields));
    }
    req[source] = result.data;
    return next();
  };
}
