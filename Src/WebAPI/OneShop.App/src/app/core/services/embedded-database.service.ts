import { Injectable, signal } from '@angular/core';

export interface DatabaseState {
  companies: any[];
  stores: any[];
  warehouses: any[];
  items: any[];
  orders: any[];
  shippingLabels: any[];
  apiKeys: any[];
  deliveryPartners: any[];
  taxes: any[];
  promos: any[];
  notifications: any[];
}

const STORAGE_KEY = 'oneshop_embedded_db_v1';
const SERVER_URL_KEY = 'oneshop_server_url';

@Injectable({
  providedIn: 'root'
})
export class EmbeddedDatabaseService {
  // Database mode: 'AUTO' (tries live server, falls back to embedded DB if unreachable), 'LOCAL' (always embedded), 'LIVE' (live server)
  dbMode = signal<'AUTO' | 'LOCAL' | 'LIVE'>('AUTO');
  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  activeSource = signal<'LIVE_SERVER' | 'EMBEDDED_DB'>('EMBEDDED_DB');
  serverUrl = signal<string>(this.getStoredServerUrl());

  private db: DatabaseState = this.loadDatabase();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.activeSource.set('EMBEDDED_DB');
      });
    }
  }

  private getStoredServerUrl(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(SERVER_URL_KEY) || 'https://localhost:7117/graphql';
    }
    return 'https://localhost:7117/graphql';
  }

  setServerUrl(url: string) {
    this.serverUrl.set(url);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SERVER_URL_KEY, url);
    }
  }

  setDbMode(mode: 'AUTO' | 'LOCAL' | 'LIVE') {
    this.dbMode.set(mode);
    if (mode === 'LOCAL') {
      this.activeSource.set('EMBEDDED_DB');
    }
  }

  private loadDatabase(): DatabaseState {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Could not parse local embedded DB, initializing default seed:', e);
      }
    }
    const seed = this.getSeedData();
    this.persist(seed);
    return seed;
  }

  private persist(state: DatabaseState) {
    this.db = state;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to persist embedded DB to localStorage:', e);
      }
    }
  }

  resetToDefaults() {
    const seed = this.getSeedData();
    this.persist(seed);
    return seed;
  }

  // --- GraphQL Operation Handler for Offline / Local Execution ---
  handleOperation(operationName: string, queryStr: string, variables: any = {}): any {
    this.activeSource.set('EMBEDDED_DB');
    const op = operationName ? operationName.toLowerCase() : '';
    const q = queryStr ? queryStr.toLowerCase() : '';

    // 0. Authentication
    if (op.includes('authenticateuser') || q.includes('authenticateuser')) {
      const uName = variables.userName || 'Dishant';
      const isCust = uName.toLowerCase().includes('cust');
      return {
        data: {
          authenticateUser: {
            success: true,
            message: 'Signed in successfully via Embedded Mobile Database.',
            userDetails: {
              userName: uName,
              userId: 'USR-EMBEDDED-101',
              accountId: 'ACC-101',
              apiToken: 'oneshop_embedded_auth_token_live',
              email: uName.includes('@') ? uName : 'admin@oneshop.com',
              company: 'OneShop Global Enterprise',
              subscriptionType: 'Enterprise',
              vendorType: 'Vendor',
              isCustomerAccount: isCust,
              isSellerAccount: !isCust
            },
            accessibleScreens: [
              { screen: { screen: 'Dashboard', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Orders', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Items', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Inventory', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'CompanyMaster', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Warehouse', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Users', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true },
              { screen: { screen: 'Settings', threshold: 100, isUnlimited: true }, canView: true, canCreate: true, canEdit: true, canDelete: true }
            ]
          }
        }
      };
    }

    // 1. Items Query
    if (op.includes('item') || q.includes('items(') || q.includes('items {')) {
      if (q.includes('item(') || q.includes('getitem(')) {
        const itemNumber = variables.itemNumber || '';
        const found = this.db.items.find(i => i.itemNumber.toUpperCase() === itemNumber.toUpperCase()) || this.db.items[0];
        return { data: { item: found } };
      }
      let filtered = [...this.db.items];
      if (variables.companyCode) {
        filtered = filtered.filter(i => i.companyCode === variables.companyCode);
      }
      if (variables.salesChannel && variables.salesChannel !== 'Both') {
        filtered = filtered.filter(i => i.salesChannel === variables.salesChannel || i.salesChannel === 'Both');
      }
      return { data: { items: filtered } };
    }

    // 2. Shipping Labels
    if (op.includes('shippinglabel') || q.includes('shippinglabel')) {
      if (q.includes('shippinglabelbyorderid')) {
        const orderId = variables.orderId || '';
        const label = this.db.shippingLabels.find(l => l.orderId === orderId) || this.db.shippingLabels[0];
        return { data: { shippingLabelByOrderId: label } };
      }
      let labels = [...this.db.shippingLabels];
      if (variables.companyCode) {
        labels = labels.filter(l => l.companyCode === variables.companyCode);
      }
      return { data: { shippingLabels: labels } };
    }

    // 3. Orders Query
    if (op.includes('order') || q.includes('orders(') || q.includes('orders {')) {
      if (q.includes('orderbyid')) {
        const orderId = variables.orderId || '';
        const order = this.db.orders.find(o => o.orderId === orderId) || this.db.orders[0];
        return { data: { orderById: order } };
      }
      let orders = [...this.db.orders];
      if (variables.companyCode) {
        orders = orders.filter(o => o.companyCode === variables.companyCode);
      }
      if (variables.status) {
        orders = orders.filter(o => o.status.toLowerCase() === variables.status.toLowerCase());
      }
      return { data: { orders } };
    }

    // 4. Companies
    if (op.includes('compan') || q.includes('companies')) {
      return { data: { companies: this.db.companies } };
    }

    // 5. Stores
    if (op.includes('store') || q.includes('stores')) {
      let stores = [...this.db.stores];
      if (variables.companyCode) {
        stores = stores.filter(s => s.companyCode === variables.companyCode);
      }
      return { data: { stores } };
    }

    // 6. Warehouses
    if (op.includes('warehouse') || q.includes('warehouses')) {
      let warehouses = [...this.db.warehouses];
      if (variables.companyCode) {
        warehouses = warehouses.filter(w => w.companyCode === variables.companyCode);
      }
      return { data: { warehouses } };
    }

    // 7. API Keys
    if (op.includes('apikey') || q.includes('apikeys')) {
      return { data: { apiKeys: this.db.apiKeys } };
    }

    // 8. Generate API Key Mutation
    if (op.includes('generateapikey') || q.includes('generateapikey')) {
      const name = variables.name || 'New API Key';
      const perms = variables.permissions || 'READ_ONLY';
      const keyId = `key_live_${Date.now()}`;
      const randomSecret = Math.random().toString(36).substring(2, 14);
      const rawKey = `oneshop_live_${randomSecret}`;
      const masked = `oneshop_live_...${rawKey.slice(-6)}`;
      const newKey = {
        keyId,
        accountId: 'ACC-101',
        name,
        apiKeyMasked: masked,
        apiToken: `token_${rawKey}`,
        permissions: perms,
        status: 'Active',
        dateCreated: new Date().toISOString(),
        expiresAt: variables.expiryDays ? new Date(Date.now() + variables.expiryDays * 86400000).toISOString() : null,
        lastUsed: null,
        createdBy: 'Vendor Admin'
      };
      this.db.apiKeys = [newKey, ...this.db.apiKeys];
      this.persist(this.db);
      return {
        data: {
          generateApiKey: {
            success: true,
            message: 'API Key generated successfully in embedded local database.',
            apiKey: rawKey,
            apiToken: newKey.apiToken,
            keyDetails: newKey
          }
        }
      };
    }

    // 9. Revoke / Delete API Key
    if (op.includes('revokeapikey') || q.includes('revokeapikey')) {
      this.db.apiKeys = this.db.apiKeys.map(k => k.keyId === variables.keyId ? { ...k, status: 'Revoked' } : k);
      this.persist(this.db);
      return { data: { revokeApiKey: { success: true, message: 'API Key revoked in embedded local DB.' } } };
    }
    if (op.includes('deleteapikey') || q.includes('deleteapikey')) {
      this.db.apiKeys = this.db.apiKeys.filter(k => k.keyId !== variables.keyId);
      this.persist(this.db);
      return { data: { deleteApiKey: { success: true, message: 'API Key deleted from embedded local DB.' } } };
    }

    // 10. Create Order Mutation
    if (op.includes('createorder') || q.includes('createorder')) {
      const input = variables.input || {};
      const orderId = `ORD-${Date.now().toString().slice(-4)}`;
      const newOrder = {
        orderId,
        companyCode: input.companyCode || 'COMP-101',
        companyName: 'OneShop Global Corp.',
        customerName: input.customerName || 'Customer',
        customerEmail: input.customerEmail || 'customer@oneshop.com',
        customerPhone: input.customerPhone || '+1 555-0199',
        channel: 'B2C Retail',
        status: 'Pending',
        subTotal: input.subTotal || 45.00,
        tax: input.tax || 4.50,
        shippingCost: input.shippingCost || 5.00,
        discount: input.discount || 0,
        totalAmount: input.totalAmount || 54.50,
        shippingAddress: input.shippingAddress || '123 Market St, New York, NY 10001',
        shippingState: input.shippingState || 'NY',
        shipVia: 'Road Freight',
        deliveryPartner: 'Delhivery',
        orderDate: new Date().toISOString(),
        items: input.items || []
      };
      this.db.orders = [newOrder, ...this.db.orders];
      this.persist(this.db);
      return {
        data: {
          createOrder: {
            success: true,
            message: 'Order created successfully in embedded database.',
            orderId
          }
        }
      };
    }

    // 11. Delivery Partners, Taxes, Promos
    if (q.includes('deliverypartners')) {
      return { data: { deliveryPartners: this.db.deliveryPartners } };
    }
    if (q.includes('taxes') || q.includes('statetaxes')) {
      return { data: { stateTaxes: this.db.taxes } };
    }
    if (q.includes('promocodes') || q.includes('promos')) {
      return { data: { promoCodes: this.db.promos } };
    }

    // Default fallback
    return { data: {} };
  }

  // --- Default Pre-Seeded Dataset ---
  private getSeedData(): DatabaseState {
    return {
      companies: [
        {
          code: 'COMP-101',
          name: 'OneShop Global Enterprise',
          displayName: 'OneShop Global',
          addressLineOne: '100 Innovation Way, Suite 400',
          city: 'San Francisco',
          stateCode: 'CA',
          countryCode: 'US',
          currencyCode: 'USD',
          contact: '+1 (415) 555-0182',
          email: 'admin@oneshop.com',
          website: 'https://oneshop.com',
          isActive: true,
          dateCreated: '2026-01-01T00:00:00Z'
        }
      ],
      stores: [
        {
          code: 'ST-DOWNTOWN',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          name: 'Downtown Flagship Store',
          displayName: 'OneShop Downtown',
          storeType: 'Retail Outlet',
          addressLineOne: '450 Market Street',
          city: 'San Francisco',
          stateCode: 'CA',
          countryCode: 'US',
          contact: '+1 (415) 555-0199',
          email: 'downtown@oneshop.com',
          isActive: true
        },
        {
          code: 'ST-WEST',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          name: 'West Coast Express Division',
          displayName: 'OneShop West',
          storeType: 'Express Kiosk',
          addressLineOne: '780 Broadway Ave',
          city: 'Los Angeles',
          stateCode: 'CA',
          countryCode: 'US',
          contact: '+1 (213) 555-0144',
          email: 'west@oneshop.com',
          isActive: true
        }
      ],
      warehouses: [
        {
          code: 'WH-CENTRAL',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          name: 'Central Logistics & Fulfillment Hub',
          displayName: 'Central Hub WH-01',
          addressLineOne: '1200 Logistics Blvd, Dock 14',
          city: 'Oakland',
          stateCode: 'CA',
          countryCode: 'US',
          contact: '+1 (510) 555-0122',
          email: 'wh-central@oneshop.com',
          isActive: true
        },
        {
          code: 'WH-NORTH',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          name: 'North Pacific Regional Warehouse',
          displayName: 'North Warehouse WH-02',
          addressLineOne: '880 Harbor Way',
          city: 'Seattle',
          stateCode: 'WA',
          countryCode: 'US',
          contact: '+1 (206) 555-0178',
          email: 'wh-north@oneshop.com',
          isActive: true
        }
      ],
      items: [
        {
          sequence: 1,
          accountId: 'ACC-101',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          itemNumber: 'ITEM-1001',
          name: 'Classic Oxford Cotton Slim Fit Shirt',
          displayName: 'Oxford Cotton Shirt',
          description: '100% long-staple combed cotton tailored with button-down collar and durable pearlized buttons.',
          category: 'Apparel',
          salesChannel: 'Both',
          b2cPrice: 42.00,
          b2cCompareAtPrice: 55.00,
          b2bPrice: 24.50,
          b2bMinQuantity: 10,
          unitOfMeasure: 'PCS',
          brand: 'OneShop Collection',
          images: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
          isActive: true,
          dateCreated: '2026-02-10T10:00:00Z',
          variants: [
            { colourCode: 'BLU', colourName: 'Sky Blue', sizeCode: 'M', sizeName: 'Medium', sku: 'OXF-BLU-M', barcode: '890123456781', additionalPrice: 0, isActive: true },
            { colourCode: 'BLU', colourName: 'Sky Blue', sizeCode: 'L', sizeName: 'Large', sku: 'OXF-BLU-L', barcode: '890123456782', additionalPrice: 0, isActive: true },
            { colourCode: 'WHT', colourName: 'Pure White', sizeCode: 'M', sizeName: 'Medium', sku: 'OXF-WHT-M', barcode: '890123456783', additionalPrice: 0, isActive: true }
          ]
        },
        {
          sequence: 2,
          accountId: 'ACC-101',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          itemNumber: 'ITEM-1002',
          name: 'Rugged Denim Sherpa Utility Jacket',
          displayName: 'Denim Utility Jacket',
          description: 'Heavyweight 14oz ring-spun denim with soft thermal sherpa fleece lining and antiqued brass hardware.',
          category: 'Outerwear',
          salesChannel: 'Both',
          b2cPrice: 89.50,
          b2cCompareAtPrice: 110.00,
          b2bPrice: 52.00,
          b2bMinQuantity: 5,
          unitOfMeasure: 'PCS',
          brand: 'OneShop Utility',
          images: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
          isActive: true,
          dateCreated: '2026-02-15T12:00:00Z',
          variants: [
            { colourCode: 'IND', colourName: 'Indigo Wash', sizeCode: 'L', sizeName: 'Large', sku: 'DNM-IND-L', barcode: '890123456784', additionalPrice: 0, isActive: true },
            { colourCode: 'BLK', colourName: 'Washed Black', sizeCode: 'XL', sizeName: 'Extra Large', sku: 'DNM-BLK-XL', barcode: '890123456785', additionalPrice: 5.00, isActive: true }
          ]
        },
        {
          sequence: 3,
          accountId: 'ACC-101',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          itemNumber: 'ITEM-1003',
          name: 'ActiveDry Breathable Training Tee',
          displayName: 'ActiveDry Training Tee',
          description: 'Ultra-lightweight moisture-wicking technical fabric engineered for high-performance workout sessions.',
          category: 'Activewear',
          salesChannel: 'Both',
          b2cPrice: 28.00,
          b2cCompareAtPrice: 35.00,
          b2bPrice: 14.00,
          b2bMinQuantity: 20,
          unitOfMeasure: 'PCS',
          brand: 'OneShop Athletic',
          images: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
          isActive: true,
          dateCreated: '2026-03-01T08:00:00Z',
          variants: [
            { colourCode: 'GRY', colourName: 'Heather Grey', sizeCode: 'M', sizeName: 'Medium', sku: 'ACT-GRY-M', barcode: '890123456786', additionalPrice: 0, isActive: true },
            { colourCode: 'BLK', colourName: 'Obsidian Black', sizeCode: 'L', sizeName: 'Large', sku: 'ACT-BLK-L', barcode: '890123456787', additionalPrice: 0, isActive: true }
          ]
        },
        {
          sequence: 4,
          accountId: 'ACC-101',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          itemNumber: 'ITEM-1004',
          name: 'Minimalist Weatherproof Commuter Backpack',
          displayName: 'Commuter Backpack',
          description: 'Water-resistant coated canvas with magnetic quick-snap closures, padded 16-inch laptop compartment.',
          category: 'Accessories',
          salesChannel: 'Both',
          b2cPrice: 79.00,
          b2cCompareAtPrice: 99.00,
          b2bPrice: 44.00,
          b2bMinQuantity: 5,
          unitOfMeasure: 'PCS',
          brand: 'OneShop Gear',
          images: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
          isActive: true,
          dateCreated: '2026-03-05T09:00:00Z',
          variants: [
            { colourCode: 'CHR', colourName: 'Charcoal Grey', sizeCode: 'STD', sizeName: 'Standard', sku: 'BPK-CHR-STD', barcode: '890123456788', additionalPrice: 0, isActive: true }
          ]
        }
      ],
      orders: [
        {
          orderId: 'ORD-1001',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          customerName: 'Marcus Vance',
          customerEmail: 'marcus.vance@example.com',
          customerPhone: '+1 (415) 555-8831',
          channel: 'B2C Retail',
          status: 'Shipped',
          subTotal: 84.00,
          tax: 7.14,
          shippingCost: 8.50,
          discount: 10.00,
          totalAmount: 89.64,
          shippingAddress: '742 Evergreen Terrace, Springfield, IL 62704',
          shippingState: 'IL',
          shipVia: 'Express Air',
          deliveryPartner: 'FedEx',
          orderDate: '2026-04-10T14:30:00Z',
          items: [
            { itemNumber: 'ITEM-1001', itemName: 'Classic Oxford Cotton Slim Fit Shirt', sizeCode: 'M', quantity: 2, unitPrice: 42.00, totalPrice: 84.00 }
          ]
        },
        {
          orderId: 'ORD-1002',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          customerName: 'Elena Rostova',
          customerEmail: 'elena.rostova@example.com',
          customerPhone: '+1 (212) 555-4490',
          channel: 'B2C Retail',
          status: 'Delivered',
          subTotal: 89.50,
          tax: 7.60,
          shippingCost: 0.00,
          discount: 0.00,
          totalAmount: 97.10,
          shippingAddress: '350 5th Avenue, New York, NY 10118',
          shippingState: 'NY',
          shipVia: 'Road Freight',
          deliveryPartner: 'BlueDart',
          orderDate: '2026-04-08T10:15:00Z',
          items: [
            { itemNumber: 'ITEM-1002', itemName: 'Rugged Denim Sherpa Utility Jacket', sizeCode: 'L', quantity: 1, unitPrice: 89.50, totalPrice: 89.50 }
          ]
        },
        {
          orderId: 'ORD-1003',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          customerName: 'Apex Outfitters Co.',
          customerEmail: 'purchasing@apexoutfitters.com',
          customerPhone: '+1 (312) 555-7720',
          channel: 'B2B Wholesale',
          status: 'Confirmed',
          subTotal: 490.00,
          tax: 39.20,
          shippingCost: 25.00,
          discount: 30.00,
          totalAmount: 524.20,
          shippingAddress: '1500 Michigan Ave, Chicago, IL 60605',
          shippingState: 'IL',
          shipVia: 'Heavy Logistics',
          deliveryPartner: 'DHL Express',
          orderDate: '2026-04-12T16:45:00Z',
          items: [
            { itemNumber: 'ITEM-1001', itemName: 'Classic Oxford Cotton Slim Fit Shirt', sizeCode: 'M', quantity: 20, unitPrice: 24.50, totalPrice: 490.00 }
          ]
        }
      ],
      shippingLabels: [
        {
          orderId: 'ORD-1001',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          customerName: 'Marcus Vance',
          customerEmail: 'marcus.vance@example.com',
          customerPhone: '+1 (415) 555-8831',
          shippingAddress: '742 Evergreen Terrace, Springfield, IL 62704',
          shippingState: 'IL',
          shipVia: 'Express Air',
          deliveryPartner: 'FedEx',
          trackingNumber: 'AWB-FEDEX-99021248',
          trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=AWB-FEDEX-99021248',
          facilityType: 'Warehouse',
          facilityCode: 'WH-CENTRAL',
          facilityName: 'Central Logistics & Fulfillment Hub',
          packageWeight: '1.20 kg',
          packageDimensions: '28 x 20 x 8 cm',
          status: 'Shipped',
          orderDate: '2026-04-10T14:30:00Z',
          dispatchDate: '2026-04-11T09:00:00Z',
          totalItems: 2,
          totalAmount: 89.64,
          notes: 'Priority air dispatch with signature verification'
        },
        {
          orderId: 'ORD-1002',
          companyCode: 'COMP-101',
          companyName: 'OneShop Global Enterprise',
          customerName: 'Elena Rostova',
          customerEmail: 'elena.rostova@example.com',
          customerPhone: '+1 (212) 555-4490',
          shippingAddress: '350 5th Avenue, New York, NY 10118',
          shippingState: 'NY',
          shipVia: 'Road Freight',
          deliveryPartner: 'BlueDart',
          trackingNumber: 'AWB-BLUEDART-88219033',
          trackingUrl: 'https://www.bluedart.com/track?awb=AWB-BLUEDART-88219033',
          facilityType: 'Store',
          facilityCode: 'ST-DOWNTOWN',
          facilityName: 'Downtown Flagship Store',
          packageWeight: '1.65 kg',
          packageDimensions: '32 x 25 x 12 cm',
          status: 'Delivered',
          orderDate: '2026-04-08T10:15:00Z',
          dispatchDate: '2026-04-08T16:00:00Z',
          totalItems: 1,
          totalAmount: 97.10,
          notes: 'Standard carton box'
        }
      ],
      apiKeys: [
        {
          keyId: 'key_live_default_seed',
          accountId: 'ACC-101',
          name: 'Default ERP & Mobile Connectivity Key',
          apiKeyMasked: 'oneshop_live_...9281',
          apiToken: 'oneshop_live_demo84739281_embedded',
          permissions: 'read:orders,read:items,read:companies,read:stores,read:warehouses,read:labels',
          status: 'Active',
          dateCreated: '2026-01-15T00:00:00Z',
          expiresAt: '2027-01-15T00:00:00Z',
          lastUsed: '2026-04-15T11:20:00Z',
          createdBy: 'System (Embedded DB)'
        }
      ],
      deliveryPartners: [
        { code: 'BLUEDART', name: 'BlueDart Express', trackingUrlTemplate: 'https://www.bluedart.com/track?awb={0}', isActive: true },
        { code: 'FEDEX', name: 'FedEx Worldwide', trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={0}', isActive: true },
        { code: 'DHL', name: 'DHL Express Global', trackingUrlTemplate: 'https://www.dhl.com/track?awb={0}', isActive: true }
      ],
      taxes: [
        { stateCode: 'CA', stateName: 'California', taxRate: 8.25, isActive: true },
        { stateCode: 'NY', stateName: 'New York', taxRate: 8.875, isActive: true },
        { stateCode: 'IL', stateName: 'Illinois', taxRate: 6.25, isActive: true }
      ],
      promos: [
        { code: 'WELCOME10', discountType: 'Percentage', discountValue: 10, isActive: true },
        { code: 'FLAT50', discountType: 'Fixed', discountValue: 50, isActive: true }
      ],
      notifications: [
        { id: 'notif-1', title: 'Order Dispatched', message: 'Order ORD-1001 has been dispatched with FedEx.', isRead: false, dateCreated: new Date().toISOString() },
        { id: 'notif-2', title: 'Low Inventory Alert', message: 'Oxford Cotton Shirt size M is running low.', isRead: false, dateCreated: new Date().toISOString() }
      ]
    };
  }
}
