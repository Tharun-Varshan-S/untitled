export interface ISearchRateLimiter {
  checkLimit(projectId: string, maxRequests: number, windowMs: number): Promise<boolean>;
}

export class NoOpRateLimiter implements ISearchRateLimiter {
  async checkLimit(projectId: string, maxRequests: number, windowMs: number): Promise<boolean> {
    return true; // Always allow
  }
}
