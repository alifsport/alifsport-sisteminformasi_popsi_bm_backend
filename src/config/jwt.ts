export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-change-me',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  accessTokenMaxAge: 60 * 60 * 1000, // 1 hour in ms
  refreshTokenMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};
