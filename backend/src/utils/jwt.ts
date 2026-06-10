import * as jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthPayload } from '../modules/auth/auth.types';

const secret: jwt.Secret = config.jwtSecret;

export const signJwt = (payload: AuthPayload): string => {
  return jwt.sign(payload, secret, {
    expiresIn: config.jwtExpiresIn as unknown as Exclude<jwt.SignOptions['expiresIn'], undefined>,
  });
};

export const verifyJwt = (token: string): AuthPayload => {
  try {
    return jwt.verify(token, secret) as AuthPayload;
  } catch {
    throw new Error('Invalid token');
  }
};
