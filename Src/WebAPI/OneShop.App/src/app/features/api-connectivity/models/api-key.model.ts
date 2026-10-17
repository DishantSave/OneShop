export interface ApiKey {
  keyId: string;
  accountId: string;
  name: string;
  apiKeyMasked: string;
  apiToken: string;
  permissions: string;
  status: 'Active' | 'Revoked' | string;
  dateCreated: string;
  expiresAt?: string;
  lastUsed?: string;
  createdBy: string;
}

export interface ApiKeyPayload {
  success: boolean;
  message: string;
  apiKey?: string;
  apiToken?: string;
  keyDetails?: ApiKey;
}

export interface PresetQuery {
  id: string;
  title: string;
  category: 'Orders' | 'Items' | 'Shipping Labels' | 'Company & Stores' | 'Warehouses';
  description: string;
  query: string;
  variables: string;
}

export interface QueryExecutionResult {
  status: number;
  statusText: string;
  executionTimeMs: number;
  data?: any;
  errors?: any[];
  rawText: string;
}
