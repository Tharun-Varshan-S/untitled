export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  ANALYTICS: '/analytics',
  UPLOADS: '/uploads',
  SETTINGS: '/settings',
};

export const AUTH_TOKEN_KEY = 'loglens_auth_token';
