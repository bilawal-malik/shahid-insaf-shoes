import env from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = status === 500 && env.isProd ? 'Something went wrong' : err.message;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      message,
      code: err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
      ...(err.fields ? { fields: err.fields } : {}),
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  });
}
