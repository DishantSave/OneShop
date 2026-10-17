import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiConnectivityService } from './services/api-connectivity.service';
import { ApiKey, ApiKeyPayload, PresetQuery, QueryExecutionResult } from './models/api-key.model';

@Component({
  selector: 'app-api-connectivity',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './api-connectivity.html'
})
export class ApiConnectivity implements OnInit {
  private apiService = inject(ApiConnectivityService);

  // Tabs
  activeTab = signal<'KEYS' | 'PLAYGROUND' | 'DOCS'>('KEYS');

  // API Keys state
  apiKeys = this.apiService.apiKeys;
  loadingKeys = this.apiService.loading;
  keySearch = signal<string>('');
  showCreateModal = signal<boolean>(false);
  showSecretModal = signal<boolean>(false);
  createdKeyPayload = signal<ApiKeyPayload | null>(null);
  isGeneratingKey = signal<boolean>(false);
  copiedSecret = signal<boolean>(false);
  copiedKeyId = signal<string | null>(null);

  // New Key Form State
  newKeyName = signal<string>('');
  newKeyExpiryDays = signal<number>(365);
  newKeyPermissions = signal<string>('READ_ONLY');

  // Playground state
  presetQueries = this.apiService.presetQueries;
  selectedPresetId = signal<string>('query-orders');
  queryText = signal<string>('');
  variablesText = signal<string>('');
  selectedAuthTokenMode = signal<string>('SESSION'); // 'SESSION' or specific apiKey.keyId
  isRunningQuery = signal<boolean>(false);
  queryResult = signal<QueryExecutionResult | null>(null);
  activeEditorTab = signal<'QUERY' | 'VARIABLES'>('QUERY');
  copiedResponse = signal<boolean>(false);

  // Playground History
  queryHistory = signal<{ title: string; timestamp: string; status: number; durationMs: number; query: string; variables: string }[]>([]);

  // Docs state
  docsSearch = signal<string>('');
  activeDocCategory = signal<string>('ALL');
  copiedCodeSnippet = signal<string | null>(null);

  // Computed values
  filteredKeys = computed(() => {
    const search = this.keySearch().trim().toLowerCase();
    const list = this.apiKeys();
    if (!search) return list;
    return list.filter(k =>
      k.name.toLowerCase().includes(search) ||
      k.apiKeyMasked.toLowerCase().includes(search) ||
      k.permissions.toLowerCase().includes(search) ||
      k.status.toLowerCase().includes(search)
    );
  });

  activeKeysCount = computed(() => this.apiKeys().filter(k => k.status === 'Active').length);
  totalKeysCount = computed(() => this.apiKeys().length);

  async ngOnInit() {
    await this.apiService.loadApiKeys();
    const initialPreset = this.presetQueries.find(p => p.id === this.selectedPresetId()) || this.presetQueries[0];
    if (initialPreset) {
      this.queryText.set(initialPreset.query);
      this.variablesText.set(initialPreset.variables);
    }
  }

  // Tab switching
  setTab(tab: 'KEYS' | 'PLAYGROUND' | 'DOCS') {
    this.activeTab.set(tab);
  }

  // --- API KEY ACTIONS ---
  openCreateModal() {
    this.newKeyName.set('');
    this.newKeyExpiryDays.set(365);
    this.newKeyPermissions.set('READ_ONLY');
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  async generateKey() {
    const name = this.newKeyName().trim();
    if (!name) return;

    this.isGeneratingKey.set(true);
    try {
      const expiry = this.newKeyExpiryDays() > 0 ? this.newKeyExpiryDays() : undefined;
      const res = await this.apiService.generateApiKey(name, this.newKeyPermissions(), expiry);
      this.isGeneratingKey.set(false);

      if (res.success) {
        this.createdKeyPayload.set(res);
        this.showCreateModal.set(false);
        this.showSecretModal.set(true);
        this.copiedSecret.set(false);
      } else {
        alert(res.message || 'Failed to generate API Key');
      }
    } catch (err: any) {
      this.isGeneratingKey.set(false);
      alert('Error: ' + err.message);
    }
  }

  closeSecretModal() {
    this.showSecretModal.set(false);
    this.createdKeyPayload.set(null);
  }

  async revokeKey(key: ApiKey) {
    if (key.status === 'Revoked') return;
    const confirmRevoke = confirm(`Are you sure you want to revoke API Key "${key.name}"? External requests using this key will be immediately rejected.`);
    if (!confirmRevoke) return;

    const res = await this.apiService.revokeApiKey(key.keyId);
    if (!res.success) {
      alert(res.message || 'Failed to revoke API Key');
    }
  }

  async deleteKey(key: ApiKey) {
    const confirmDelete = confirm(`Permanently delete API Key "${key.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    const res = await this.apiService.deleteApiKey(key.keyId);
    if (!res.success) {
      alert(res.message || 'Failed to delete API Key');
    }
  }

  copyToClipboard(text: string, type: 'secret' | 'keyId' | 'response' | 'code', keyId?: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'secret') {
        this.copiedSecret.set(true);
        setTimeout(() => this.copiedSecret.set(false), 2500);
      } else if (type === 'keyId' && keyId) {
        this.copiedKeyId.set(keyId);
        setTimeout(() => this.copiedKeyId.set(null), 2000);
      } else if (type === 'response') {
        this.copiedResponse.set(true);
        setTimeout(() => this.copiedResponse.set(false), 2000);
      } else if (type === 'code') {
        this.copiedCodeSnippet.set(text);
        setTimeout(() => this.copiedCodeSnippet.set(null), 2500);
      }
    });
  }

  // --- PLAYGROUND ACTIONS ---
  onPresetChange(presetId: string) {
    this.selectedPresetId.set(presetId);
    const preset = this.presetQueries.find(p => p.id === presetId);
    if (preset) {
      this.queryText.set(preset.query);
      this.variablesText.set(preset.variables);
    }
  }

  formatQuery() {
    // Basic indent formatting if needed
    const q = this.queryText().trim();
    if (q) {
      this.queryText.set(q);
    }
    const v = this.variablesText().trim();
    if (v) {
      try {
        const parsed = JSON.parse(v);
        this.variablesText.set(JSON.stringify(parsed, null, 2));
      } catch {
        // ignore format error
      }
    }
  }

  async runPlaygroundQuery() {
    const query = this.queryText().trim();
    if (!query) {
      alert('Please enter a GraphQL query.');
      return;
    }

    this.isRunningQuery.set(true);

    let tokenOverride: string | undefined = undefined;
    const authMode = this.selectedAuthTokenMode();
    if (authMode !== 'SESSION') {
      const keyObj = this.apiKeys().find(k => k.keyId === authMode);
      if (keyObj && keyObj.apiToken) {
        tokenOverride = keyObj.apiToken;
      }
    }

    try {
      const result = await this.apiService.executePlaygroundQuery(
        query,
        this.variablesText(),
        tokenOverride
      );

      this.queryResult.set(result);

      // Add to history
      const currentPreset = this.presetQueries.find(p => p.id === this.selectedPresetId());
      const title = currentPreset ? currentPreset.title : 'Custom Query';
      this.queryHistory.update(h => [
        {
          title,
          timestamp: new Date().toLocaleTimeString(),
          status: result.status,
          durationMs: result.executionTimeMs,
          query,
          variables: this.variablesText()
        },
        ...h.slice(0, 14) // keep last 15
      ]);
    } finally {
      this.isRunningQuery.set(false);
    }
  }

  loadHistoryItem(item: { query: string; variables: string }) {
    this.queryText.set(item.query);
    this.variablesText.set(item.variables);
  }

  downloadResponseJson() {
    const res = this.queryResult();
    if (!res || !res.rawText) return;

    const blob = new Blob([res.rawText], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphql-response-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // --- DOCS ACTIONS ---
  openInPlayground(presetId: string) {
    this.onPresetChange(presetId);
    this.activeTab.set('PLAYGROUND');
  }

  getEndpointCurl(queryName: string, queryBody: string, variables: string = '{}'): string {
    const endpoint = window.location.hostname === 'localhost' ? 'https://localhost:7117/graphql' : `${window.location.origin}/graphql`;
    const cleanQuery = queryBody.replace(/\n/g, ' ').replace(/"/g, '\\"');
    return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -d '{"query": "${cleanQuery}", "variables": ${variables}}'`;
  }

  getEndpointJs(queryBody: string, variables: string = '{}'): string {
    const endpoint = window.location.hostname === 'localhost' ? 'https://localhost:7117/graphql' : '/graphql';
    return `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY_HERE'
  },
  body: JSON.stringify({
    query: \`${queryBody.trim()}\`,
    variables: ${variables.trim() || '{}'}
  })
});
const result = await response.json();
console.log(result.data);`;
  }

  getEndpointPython(queryBody: string, variables: string = '{}'): string {
    return `import requests

url = "https://your-domain.com/graphql"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY_HERE"
}
payload = {
    "query": """${queryBody.trim()}""",
    "variables": ${variables.trim() || '{}'}
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
  }
}
