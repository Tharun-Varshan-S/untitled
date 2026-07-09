export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  projectId: string;
  createdBy: string;
  lastUsedAt?: string;
  revoked: boolean;
  revokedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  // This is only returned ONCE when the key is created
  key?: string; 
}

export interface CreateApiKeyPayload {
  name: string;
  expiresAt?: string;
}
