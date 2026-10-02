import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, name: user.name }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
