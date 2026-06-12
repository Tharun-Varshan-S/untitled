import crypto from 'crypto';

const PREFIX = 'll_live_';

export const generateApiKey = (): string => {
  const bytes = crypto.randomBytes(32); // 32 bytes = 256 bits
  // base64url encode
  const raw = bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${PREFIX}${raw}`;
};

export const hashApiKey = (rawKey: string): string => {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
};

export const extractPrefixFromRaw = (rawKey: string): string => {
  if (!rawKey.startsWith(PREFIX)) return rawKey.slice(0, 8);
  const remainder = rawKey.slice(PREFIX.length);
  return remainder.slice(0, 8);
};

export const API_KEY_PREFIX = PREFIX;
