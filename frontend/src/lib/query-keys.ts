export const QUERY_KEYS = {
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
  },
  analytics: {
    overview: (projectId: string) => ['analytics', 'overview', projectId] as const,
    logLevels: (projectId: string) => ['analytics', 'logLevels', projectId] as const,
    services: (projectId: string) => ['analytics', 'services', projectId] as const,
  },
  uploads: {
    list: (projectId: string) => ['uploads', projectId] as const,
  },
  auth: {
    session: ['auth', 'session'] as const,
  },
};
