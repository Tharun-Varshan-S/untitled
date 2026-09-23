import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as elasticsearchService from '../services/elasticsearch.service';
import { connectElasticsearch, disconnectElasticsearch, getElasticsearchClient, isElasticsearchAvailable } from '../config/elasticsearch';

describe('Elasticsearch Integration Tests', () => {
  const projectId = 'test-project-123';

  beforeAll(async () => {
    await connectElasticsearch();
  });

  afterAll(async () => {
    if (isElasticsearchAvailable()) {
      const client = getElasticsearchClient();
      try {
        await client.indices.delete({ index: elasticsearchService.getIndexName(projectId) });
      } catch (e) {
        // Ignore if index doesn't exist
      }
    }
    await disconnectElasticsearch();
  });

  it('should ensure index exists', async () => {
    if (!isElasticsearchAvailable()) {
      console.warn('Skipping ES test because ES is not available');
      return;
    }
    
    await elasticsearchService.ensureIndex(projectId);
    const client = getElasticsearchClient();
    const exists = await client.indices.exists({ index: elasticsearchService.getIndexName(projectId) });
    expect(exists).toBe(true);
  });

  it('should index a log and search for it', async () => {
    if (!isElasticsearchAvailable()) return;

    const doc = {
      _mongoId: '5f9b3b9b9b9b9b9b9b9b9b9b',
      projectId,
      level: 'error',
      normalizedLevel: 'error',
      message: 'Integration test message',
      service: 'test-service',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const indexed = await elasticsearchService.indexLog(doc);
    expect(indexed).toBe(true);
    
    // Refresh the index to make the document searchable immediately
    const client = getElasticsearchClient();
    await client.indices.refresh({ index: elasticsearchService.getIndexName(projectId) });
    
    const searchRes = await elasticsearchService.searchLogs(projectId, { q: 'Integration' }, 10, 0);
    expect(searchRes).not.toBeNull();
    expect(searchRes!.total).toBeGreaterThanOrEqual(1);
    expect(searchRes!.hits[0]._id).toBe('5f9b3b9b9b9b9b9b9b9b9b9b');
    expect(searchRes!.hits[0]._source.message).toBe('Integration test message');
  });

  it('should run aggregations', async () => {
    if (!isElasticsearchAvailable()) return;

    const client = getElasticsearchClient();
    await client.indices.refresh({ index: elasticsearchService.getIndexName(projectId) });

    const aggs = await elasticsearchService.aggregateLogs(projectId, 24);
    expect(aggs).not.toBeNull();
    expect(aggs!.totalLogs).toBeGreaterThanOrEqual(1);
    expect(aggs!.levelDistribution).toHaveProperty('error');
    expect(aggs!.serviceDistribution.some(s => s.service === 'test-service')).toBe(true);
  });
});
