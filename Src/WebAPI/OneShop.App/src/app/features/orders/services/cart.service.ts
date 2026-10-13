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

  resolveUnitPrice(item: { b2cPrice?: number; b2bPrice?: number; b2bMinQuantity?: number; unitPrice: number }, quantity: number): number {
    const minQty = (item.b2bMinQuantity && item.b2bMinQuantity > 0) ? item.b2bMinQuantity : 10;
    if (item.b2bPrice && item.b2bPrice > 0 && quantity >= minQty) {
      return item.b2bPrice;
    }
    return item.b2cPrice || item.unitPrice || 0;
  }

  addToCart(newItem: Omit<CartItem, 'id'>) {
    const key = `${newItem.itemNumber.toUpperCase()}::${newItem.sizeCode.toUpperCase()}::${newItem.companyCode.toUpperCase()}::${newItem.locationCode.toUpperCase()}`;
    const current = this.cartItems();
    const existingIndex = current.findIndex(i => i.id === key);

    if (existingIndex > -1) {
      const updated = [...current];
      const newQty = updated[existingIndex].quantity + newItem.quantity;
      const effectivePrice = this.resolveUnitPrice(updated[existingIndex], newQty);
      const isWholesale = updated[existingIndex].b2bPrice && updated[existingIndex].b2bPrice! > 0 && newQty >= (updated[existingIndex].b2bMinQuantity || 10);
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        unitPrice: effectivePrice,
        channel: isWholesale ? 'B2B' : updated[existingIndex].channel
      };
      this.cartItems.set(updated);
    } else {
      const effectivePrice = this.resolveUnitPrice(newItem, newItem.quantity);
      const isWholesale = newItem.b2bPrice && newItem.b2bPrice > 0 && newItem.quantity >= (newItem.b2bMinQuantity || 10);
      this.cartItems.set([...current, {
        ...newItem,
        id: key,
        unitPrice: effectivePrice,
        channel: isWholesale ? 'B2B' : newItem.channel
      }]);
    }
  }

  updateQuantity(id: string, newQty: number) {
    if (newQty <= 0) {
      this.removeFromCart(id);
      return;
    }
    this.cartItems.update(items =>
      items.map(item => {
        if (item.id === id) {
          const effectivePrice = this.resolveUnitPrice(item, newQty);
          const isWholesale = item.b2bPrice && item.b2bPrice > 0 && newQty >= (item.b2bMinQuantity || 10);
          return {
            ...item,
            quantity: newQty,
            unitPrice: effectivePrice,
            channel: isWholesale ? 'B2B' : (item.b2cPrice ? 'B2C' : 'Both')
          };
        }
        return item;
      })
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
    otherTax?: number;
    shippingCost?: number;
    platformFee?: number;
    paymentStatus?: string;
    shipVia?: string;
    deliveryPartner?: string;
    pickupLocationCode?: string;
    pickupLocationName?: string;
  }): OrderInput[] {
    const groups = this.segregatedGroups();
    const count = groups.length || 1;

    return groups.map(g => {
      // Check if this group contains wholesale quantities
      const hasWholesaleItems = g.items.some(it => {
        const minQty = (it.b2bMinQuantity && it.b2bMinQuantity > 0) ? it.b2bMinQuantity : 10;
        return (it.b2bPrice && it.b2bPrice > 0 && it.quantity >= minQty) || it.channel === 'B2B';
      });

      const isWarehouse = g.locationType === 'Warehouse' || hasWholesaleItems;
      const grpDiscount = customerInfo?.discount ? Math.round((customerInfo.discount / count) * 100) / 100 : 0;
      const grpShipping = customerInfo?.shippingCost !== undefined ? Math.round((customerInfo.shippingCost / count) * 100) / 100 : 0;
      const grpTax = customerInfo?.tax ? Math.round((customerInfo.tax / count) * 100) / 100 : 0;
      const grpOtherTax = customerInfo?.otherTax ? Math.round((customerInfo.otherTax / count) * 100) / 100 : 0;
      const grpPlatformFee = customerInfo?.platformFee !== undefined ? Math.round((customerInfo.platformFee / count) * 100) / 100 : 0.50;

      const groupItemCount = g.items.reduce((s, it) => s + it.quantity, 0) || 1;

      // When wholesale items are present, small-scale couriers cannot carry this bulk load.
      // Automatically allot 'Road Freight' and ensure Warehouse fulfillment!
      const effectiveShipVia = isWarehouse ? (customerInfo?.shipVia || 'Road Freight') : undefined;
      const effectiveDeliveryPartner = isWarehouse ? 'Road Freight Logistics' : (customerInfo?.deliveryPartner || undefined);

      return {
        companyCode: g.companyCode,
        orderId: g.assignedOrderId,
        channel: isWarehouse ? 'B2B' : 'B2C',
        locationType: isWarehouse ? 'Warehouse' : g.locationType,
        locationCode: (isWarehouse && g.locationType === 'Store') ? 'WH-MAIN' : g.locationCode,
        status: 'Pending',
        paymentStatus: customerInfo?.paymentStatus || 'Paid',
        customerName: customerInfo?.name,
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phone,
        shippingAddress: customerInfo?.address,
        shippingState: customerInfo?.state,
        promoCode: customerInfo?.promoCode,
        tax: grpTax,
        otherTax: grpOtherTax,
        shippingCost: grpShipping,
        discount: grpDiscount,
        platformFee: grpPlatformFee,
        shipVia: effectiveShipVia,
        deliveryPartner: effectiveDeliveryPartner,
        pickupLocationCode: !isWarehouse ? customerInfo?.pickupLocationCode : undefined,
        pickupLocationName: !isWarehouse ? customerInfo?.pickupLocationName : undefined,
        notes: customerInfo?.notes,
        items: g.items.map(it => {
          const minQty = (it.b2bMinQuantity && it.b2bMinQuantity > 0) ? it.b2bMinQuantity : 10;
          const effectivePrice = (it.b2bPrice && it.b2bPrice > 0 && it.quantity >= minQty)
            ? it.b2bPrice
            : (it.unitPrice || it.b2cPrice || 0);

          const itemTax = it.taxAmount ?? (Math.round((grpTax * (it.quantity / groupItemCount)) * 100) / 100);
          const itemShipping = it.shippingAmount ?? (Math.round((grpShipping * (it.quantity / groupItemCount)) * 100) / 100);
          const itemDiscount = it.discountAmount ?? (Math.round((grpDiscount * (it.quantity / groupItemCount)) * 100) / 100);

          return {
            itemNumber: it.itemNumber,
            itemName: it.itemName,
            sizeCode: it.sizeCode,
            quantity: it.quantity,
            unitPrice: effectivePrice,
            tax: itemTax,
            shippingCost: itemShipping,
            discount: itemDiscount
          };
        })
      };
    });
  }
}

