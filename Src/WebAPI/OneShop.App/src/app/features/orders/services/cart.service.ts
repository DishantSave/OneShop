import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem, SegregatedOrderGroup, OrderInput } from '../models/order.model';

const CART_STORAGE_KEY = 'oneshop_cart_items';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>(this.loadCartFromStorage());
  isDrawerOpen = signal<boolean>(false);

  cartCount = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  cartSubtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  });

  // Automatically segregate items by Company and Location (Store / Warehouse)
  segregatedGroups = computed<SegregatedOrderGroup[]>(() => {
    const items = this.cartItems();
    if (items.length === 0) return [];

    const groupMap = new Map<string, CartItem[]>();

    for (const item of items) {
      const key = `${item.companyCode.toUpperCase()}::${item.locationType}::${item.locationCode.toUpperCase()}`;
      const existing = groupMap.get(key) || [];
      existing.push(item);
      groupMap.set(key, existing);
    }

    // Generate deterministic base ID for this checkout batch
    const baseId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const groups: SegregatedOrderGroup[] = [];
    let index = 0;

    groupMap.forEach((groupItems, key) => {
      const parts = key.split('::');
      const companyCode = parts[0];
      const locationType = parts[1] as 'Store' | 'Warehouse';
      const locationCode = parts[2];
      const companyName = groupItems[0]?.companyName || companyCode;
      const locationName = groupItems[0]?.locationName || locationCode;
      const channel = groupItems[0]?.channel || 'Both';

      const totalItems = groupItems.reduce((acc, it) => acc + it.quantity, 0);
      const subTotal = groupItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

      // Order Named OrderId, OrderId.2, OrderId.3 and so on...
      const assignedOrderId = (index === 0) ? baseId : `${baseId}.${index + 1}`;

      groups.push({
        groupKey: key,
        companyCode,
        companyName,
        locationType,
        locationCode,
        locationName,
        channel,
        items: groupItems,
        totalItems,
        subTotal,
        assignedOrderId
      });

      index++;
    });

    return groups;
  });

  constructor() {
    effect(() => {
      const items = this.cartItems();
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to persist cart to localStorage', e);
      }
    });
  }

  private loadCartFromStorage(): CartItem[] {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  openDrawer() {
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer() {
    this.isDrawerOpen.update(v => !v);
  }

  addToCart(newItem: Omit<CartItem, 'id'>) {
    const key = `${newItem.itemNumber.toUpperCase()}::${newItem.sizeCode.toUpperCase()}::${newItem.companyCode.toUpperCase()}::${newItem.locationCode.toUpperCase()}`;
    const current = this.cartItems();
    const existingIndex = current.findIndex(i => i.id === key);

    if (existingIndex > -1) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + newItem.quantity
      };
      this.cartItems.set(updated);
    } else {
      this.cartItems.set([...current, { ...newItem, id: key }]);
    }
  }

  updateQuantity(id: string, newQty: number) {
    if (newQty <= 0) {
      this.removeFromCart(id);
      return;
    }
    this.cartItems.update(items =>
      items.map(item => item.id === id ? { ...item, quantity: newQty } : item)
    );
  }

  updateItemLocation(id: string, locationType: 'Store' | 'Warehouse', locationCode: string, locationName?: string) {
    this.cartItems.update(items =>
      items.map(item => {
        if (item.id === id) {
          const newKey = `${item.itemNumber.toUpperCase()}::${item.sizeCode.toUpperCase()}::${item.companyCode.toUpperCase()}::${locationCode.toUpperCase()}`;
          return {
            ...item,
            id: newKey,
            locationType,
            locationCode,
            locationName: locationName || locationCode
          };
        }
        return item;
      })
    );
  }

  removeFromCart(id: string) {
    this.cartItems.update(items => items.filter(i => i.id !== id));
  }

  clearCart() {
    this.cartItems.set([]);
  }

  toOrderInputs(customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    state?: string;
    notes?: string;
    promoCode?: string;
    discount?: number;
    tax?: number;
    shippingCost?: number;
    shipVia?: string;
    deliveryPartner?: string;
    pickupLocationCode?: string;
    pickupLocationName?: string;
  }): OrderInput[] {
    const groups = this.segregatedGroups();
    const count = groups.length || 1;

    return groups.map(g => {
      const isWarehouse = g.locationType === 'Warehouse';
      const grpDiscount = customerInfo?.discount ? Math.round((customerInfo.discount / count) * 100) / 100 : 0;
      const grpShipping = customerInfo?.shippingCost ? Math.round((customerInfo.shippingCost / count) * 100) / 100 : 0;
      const grpTax = customerInfo?.tax ? Math.round((customerInfo.tax / count) * 100) / 100 : 0;

      return {
        companyCode: g.companyCode,
        orderId: g.assignedOrderId,
        channel: isWarehouse ? 'B2B' : 'B2C',
        locationType: g.locationType,
        locationCode: g.locationCode,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        customerName: customerInfo?.name,
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phone,
        shippingAddress: customerInfo?.address,
        shippingState: customerInfo?.state,
        promoCode: customerInfo?.promoCode,
        tax: grpTax,
        shippingCost: grpShipping,
        discount: grpDiscount,
        shipVia: isWarehouse ? (customerInfo?.shipVia || 'Road Freight') : undefined,
        deliveryPartner: !isWarehouse ? (customerInfo?.deliveryPartner || 'Delhivery') : undefined,
        pickupLocationCode: !isWarehouse ? customerInfo?.pickupLocationCode : undefined,
        pickupLocationName: !isWarehouse ? customerInfo?.pickupLocationName : undefined,
        notes: customerInfo?.notes,
        items: g.items.map(it => ({
          itemNumber: it.itemNumber,
          itemName: it.itemName,
          sizeCode: it.sizeCode,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        }))
      };
    });
  }
}

