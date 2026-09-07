export const API_BASE_URL = (typeof window === 'undefined' ? process.env.INTERNAL_API_URL : null) || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api';

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
