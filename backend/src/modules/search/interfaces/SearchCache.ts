import { PaginatedSearchResponse } from '../../../types/search.types';

export interface ISearchCache {
  get(key: string): Promise<PaginatedSearchResponse | null>;
  set(key: string, data: PaginatedSearchResponse, ttlSeconds: number): Promise<void>;
}

export class NoOpCache implements ISearchCache {
  async get(key: string): Promise<PaginatedSearchResponse | null> {
    return null; // Cache miss
  }

  async set(key: string, data: PaginatedSearchResponse, ttlSeconds: number): Promise<void> {
    // Do nothing
  }
}
