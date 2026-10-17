import { Injectable, inject, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { firstValueFrom } from 'rxjs';
import { ApiKey, ApiKeyPayload, PresetQuery, QueryExecutionResult } from '../models/api-key.model';

export const GET_API_KEYS = gql`
  query GetApiKeys {
    apiKeys {
      keyId
      accountId
      name
      apiKeyMasked
      apiToken
      permissions
      status
      dateCreated
      expiresAt
      lastUsed
      createdBy
    }
  }
`;

export const GENERATE_API_KEY = gql`
  mutation GenerateApiKey($name: String!, $permissions: String, $expiryDays: Int) {
    generateApiKey(name: $name, permissions: $permissions, expiryDays: $expiryDays) {
      success
      message
      apiKey
      apiToken
      keyDetails {
        keyId
        accountId
        name
        apiKeyMasked
        apiToken
        permissions
        status
        dateCreated
        expiresAt
        lastUsed
        createdBy
      }
    }
  }
`;

export const REVOKE_API_KEY = gql`
  mutation RevokeApiKey($keyId: String!) {
    revokeApiKey(keyId: $keyId) {
      success
      message
    }
  }
`;

export const DELETE_API_KEY = gql`
  mutation DeleteApiKey($keyId: String!) {
    deleteApiKey(keyId: $keyId) {
      success
      message
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ApiConnectivityService {
  private apollo = inject(Apollo);

  apiKeys = signal<ApiKey[]>([]);
  loading = signal<boolean>(false);

  presetQueries: PresetQuery[] = [
    {
      id: 'query-orders',
      title: 'Query Recent Orders & Line Items',
      category: 'Orders',
      description: 'Fetch real-time customer and wholesale orders with line items, financial breakdown, shipping addresses, and status.',
      query: `query GetOrders($companyCode: String, $status: String) {
  orders(companyCode: $companyCode, status: $status) {
    orderId
    companyCode
    companyName
    customerName
    customerEmail
    customerPhone
    channel
    status
    subTotal
    tax
    shippingCost
    discount
    totalAmount
    shippingAddress
    shippingState
    shipVia
    deliveryPartner
    orderDate
    items {
      itemNumber
      itemName
      sizeCode
      quantity
      unitPrice
      totalPrice
    }
  }
}`,
      variables: `{\n  "companyCode": null,\n  "status": null\n}`
    },
    {
      id: 'query-shipping-labels',
      title: 'Query Shipping Labels & Logistics Dispatch',
      category: 'Shipping Labels',
      description: 'Query comprehensive shipping labels, tracking AWB numbers, carrier assignments, package dimensions, weight, and fulfillment warehouses.',
      query: `query GetShippingLabels($companyCode: String) {
  shippingLabels(companyCode: $companyCode) {
    orderId
    companyCode
    companyName
    customerName
    customerPhone
    shippingAddress
    shippingState
    deliveryPartner
    shipVia
    trackingNumber
    trackingUrl
    facilityType
    facilityCode
    facilityName
    packageWeight
    packageDimensions
    status
    orderDate
    dispatchDate
    totalItems
    totalAmount
    notes
  }
}`,
      variables: `{\n  "companyCode": null\n}`
    },
    {
      id: 'query-order-by-id',
      title: 'Query Single Order with Audit Trail',
      category: 'Orders',
      description: 'Fetch detailed information and immutable status audit logs for a single order number.',
      query: `query GetOrderById($companyCode: String!, $orderId: String!) {
  orderById(companyCode: $companyCode, orderId: $orderId) {
    orderId
    companyCode
    customerName
    status
    totalAmount
    shippingAddress
    shipVia
    deliveryPartner
    notes
    items {
      itemNumber
      itemName
      quantity
      unitPrice
    }
    auditTrail {
      action
      previousStatus
      newStatus
      dateAdded
      changedBy
    }
  }
}`,
      variables: `{\n  "companyCode": "COMP-101",\n  "orderId": "ORD-1001"\n}`
    },
    {
      id: 'query-single-label',
      title: 'Query Shipping Label by Order ID',
      category: 'Shipping Labels',
      description: 'Retrieve package dispatch labeling details for a specific order by order number.',
      query: `query GetShippingLabelByOrderId($companyCode: String!, $orderId: String!) {
  shippingLabelByOrderId(companyCode: $companyCode, orderId: $orderId) {
    orderId
    companyCode
    customerName
    shippingAddress
    deliveryPartner
    shipVia
    trackingNumber
    trackingUrl
    facilityName
    facilityType
    status
    dispatchDate
  }
}`,
      variables: `{\n  "companyCode": "COMP-101",\n  "orderId": "ORD-1001"\n}`
    },
    {
      id: 'query-items',
      title: 'Query Products Catalog & Variants',
      category: 'Items',
      description: 'Export inventory items, wholesale/retail pricing tiers, barcodes, and SKU variants.',
      query: `query GetItems($companyCode: String, $salesChannel: String) {
  items(companyCode: $companyCode, salesChannel: $salesChannel) {
    itemNumber
    companyCode
    companyName
    name
    displayName
    description
    category
    salesChannel
    b2cPrice
    b2cCompareAtPrice
    b2bPrice
    b2bMinQuantity
    unitOfMeasure
    brand
    isActive
    variants {
      colourCode
      sizeCode
      sku
      barcode
      additionalPrice
    }
  }
}`,
      variables: `{\n  "companyCode": null,\n  "salesChannel": null\n}`
    },
    {
      id: 'query-companies',
      title: 'Query Registered Companies',
      category: 'Company & Stores',
      description: 'Query company profiles, contact details, currency codes, and operational status.',
      query: `query GetCompanies {
  companies {
    code
    name
    displayName
    city
    stateCode
    countryCode
    currencyCode
    contact
    email
    isActive
  }
}`,
      variables: `{}`
    },
    {
      id: 'query-stores',
      title: 'Query Stores & Division Locations',
      category: 'Company & Stores',
      description: 'Retrieve physical retail store locations and division manager contact points.',
      query: `query GetStores($companyCode: String) {
  stores(companyCode: $companyCode) {
    code
    companyCode
    companyName
    name
    displayName
    storeType
    addressLineOne
    city
    stateCode
    countryCode
    contact
    email
    isActive
  }
}`,
      variables: `{\n  "companyCode": null\n}`
    },
    {
      id: 'query-warehouses',
      title: 'Query Warehouses & Fulfillment Centers',
      category: 'Warehouses',
      description: 'Fetch fulfillment center facilities, storage capacities, and dispatch addresses.',
      query: `query GetWarehouses($companyCode: String) {
  warehouses(companyCode: $companyCode) {
    code
    companyCode
    companyName
    name
    displayName
    addressLineOne
    city
    stateCode
    countryCode
    contact
    email
    isActive
  }
}`,
      variables: `{\n  "companyCode": null\n}`
    }
  ];

  async loadApiKeys(): Promise<ApiKey[]> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.apollo.query<{ apiKeys: ApiKey[] }>({
          query: GET_API_KEYS,
          fetchPolicy: 'network-only'
        })
      );
      const keys = res.data?.apiKeys || [];
      this.apiKeys.set(keys);
      return keys;
    } catch (err) {
      console.error('Failed to load API keys:', err);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async generateApiKey(name: string, permissions?: string, expiryDays?: number): Promise<ApiKeyPayload> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ generateApiKey: ApiKeyPayload }>({
          mutation: GENERATE_API_KEY,
          variables: {
            name: name.trim(),
            permissions: permissions || 'READ_ONLY',
            expiryDays: expiryDays && expiryDays > 0 ? expiryDays : null
          }
        })
      );

      const payload = res.data?.generateApiKey;
      if (payload?.success) {
        await this.loadApiKeys();
      }
      return payload || { success: false, message: 'No response from server.' };
    } catch (err: any) {
      console.error('generateApiKey error:', err);
      const graphQLErrors = err.graphQLErrors?.map((e: any) => e.message).join(', ');
      const networkMsg = err.networkError?.error?.errors?.map((e: any) => e.message).join(', ')
        || err.networkError?.message;
      return {
        success: false,
        message: graphQLErrors || networkMsg || err.message || 'Failed to generate API Key.'
      };
    }
  }

  async revokeApiKey(keyId: string): Promise<ApiKeyPayload> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ revokeApiKey: ApiKeyPayload }>({
          mutation: REVOKE_API_KEY,
          variables: { keyId }
        })
      );

      const payload = res.data?.revokeApiKey;
      if (payload?.success) {
        this.apiKeys.update(keys =>
          keys.map(k => k.keyId === keyId ? { ...k, status: 'Revoked' } : k)
        );
      }
      return payload || { success: false, message: 'No response from server.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to revoke API Key.' };
    }
  }

  async deleteApiKey(keyId: string): Promise<ApiKeyPayload> {
    try {
      const res = await firstValueFrom(
        this.apollo.mutate<{ deleteApiKey: ApiKeyPayload }>({
          mutation: DELETE_API_KEY,
          variables: { keyId }
        })
      );

      const payload = res.data?.deleteApiKey;
      if (payload?.success) {
        this.apiKeys.update(keys => keys.filter(k => k.keyId !== keyId));
      }
      return payload || { success: false, message: 'No response from server.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to delete API Key.' };
    }
  }

  async executePlaygroundQuery(query: string, variablesStr: string, tokenOverride?: string): Promise<QueryExecutionResult> {
    const start = performance.now();
    let variables: any = {};
    if (variablesStr && variablesStr.trim()) {
      try {
        variables = JSON.parse(variablesStr);
      } catch (e: any) {
        return {
          status: 400,
          statusText: 'Bad Request - Variables JSON parse error',
          executionTimeMs: 0,
          errors: [{ message: `Variables syntax error: ${e.message}` }],
          rawText: JSON.stringify({ errors: [{ message: `Variables syntax error: ${e.message}` }] }, null, 2)
        };
      }
    }

    const token = tokenOverride || localStorage.getItem('authToken') || '';
    const endpoint = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'https://localhost:7117/graphql'
      : '/graphql';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-API-Key': token
        },
        body: JSON.stringify({
          query,
          variables
        })
      });

      const end = performance.now();
      const timeMs = Math.round(end - start);
      const text = await response.text();

      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseErr: any) {
        return {
          status: response.status,
          statusText: response.statusText || 'Parse Error',
          executionTimeMs: timeMs,
          errors: [{ message: `Failed to parse response: ${text.slice(0, 300)}` }],
          rawText: text
        };
      }

      return {
        status: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
        executionTimeMs: timeMs,
        data: json.data,
        errors: json.errors,
        rawText: JSON.stringify(json, null, 2)
      };
    } catch (err: any) {
      const end = performance.now();
      return {
        status: 500,
        statusText: 'Network / Connection Error',
        executionTimeMs: Math.round(end - start),
        errors: [{ message: err.message || 'Failed to connect to GraphQL endpoint.' }],
        rawText: JSON.stringify({ errors: [{ message: err.message || 'Failed to connect.' }] }, null, 2)
      };
    }
  }
}
