export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  ANALYTICS: '/analytics',
  SEARCH: '/search',
  UPLOADS: '/uploads',
  SETTINGS: '/settings',
};

export const AUTH_TOKEN_KEY = 'loglens_auth_token';
