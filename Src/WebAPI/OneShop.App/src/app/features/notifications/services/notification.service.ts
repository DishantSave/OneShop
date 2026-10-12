import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { OrderService } from '../../orders/services/order.service';
import { Account } from '../../../core/services/account';
import { OrderNotification } from '../models/notification.model';
import { Order } from '../../orders/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private orderService = inject(OrderService);
  private account = inject(Account);

  private readOrderIds = signal<Set<string>>(new Set<string>());
  private dismissedOrderIds = signal<Set<string>>(new Set<string>());
  private timerId: any = null;

  notifications = signal<OrderNotification[]>([]);
  loading = signal<boolean>(false);

  unreadCount = computed(() => {
    return this.notifications().filter(n => !n.isRead).length;
  });

  recentNotifications = computed(() => {
    return this.notifications().slice(0, 5);
  });

  constructor() {
    this.loadPersistedState();

    // Recompute notifications whenever orderService.orders changes
    effect(() => {
      const orders = this.orderService.orders();
      this.rebuildNotifications(orders);
    });

    this.startPolling();
  }

  private loadPersistedState() {
    try {
      const user = this.account.getUserDetails();
      const userKey = user?.userName || 'global';
      const readRaw = localStorage.getItem(`read_notifs_${userKey}`);
      if (readRaw) {
        this.readOrderIds.set(new Set<string>(JSON.parse(readRaw)));
      }
      const dismissedRaw = localStorage.getItem(`dismissed_notifs_${userKey}`);
      if (dismissedRaw) {
        this.dismissedOrderIds.set(new Set<string>(JSON.parse(dismissedRaw)));
      }
    } catch {}
  }

  private savePersistedState() {
    try {
      const user = this.account.getUserDetails();
      const userKey = user?.userName || 'global';
      localStorage.setItem(`read_notifs_${userKey}`, JSON.stringify(Array.from(this.readOrderIds())));
      localStorage.setItem(`dismissed_notifs_${userKey}`, JSON.stringify(Array.from(this.dismissedOrderIds())));
    } catch {}
  }

  private rebuildNotifications(orders: Order[]) {
    if (!orders || orders.length === 0) {
      this.notifications.set([]);
      return;
    }

    const user = this.account.getUserDetails();
    const isCustomer = user?.isCustomerAccount === true && !user?.isSellerAccount;
    const dismissed = this.dismissedOrderIds();
    const readSet = this.readOrderIds();

    const notifs: OrderNotification[] = [];

    for (const o of orders) {
      if (dismissed.has(o.orderId.toUpperCase())) continue;

      const isRead = readSet.has(o.orderId.toUpperCase());
      const custName = o.customerName || o.createdBy || 'Customer';
      const unitsText = o.totalItems ? `${o.totalItems} unit(s)` : 'Item(s)';
      const amountText = o.totalAmount ? `$${o.totalAmount.toFixed(2)}` : '$0.00';

      let title: string;
      let message: string;

      if (isCustomer) {
        title = `Order ${o.orderId} Placed`;
        message = `Your order for ${unitsText} (${amountText}) is currently ${o.status}. Fulfilling from ${o.companyName || o.companyCode}.`;
      } else {
        title = `New Order Received: ${o.orderId}`;
        message = `${custName} ordered ${unitsText} totaling ${amountText} via ${o.channel || 'Retail'}. Status: ${o.status}.`;
      }

      notifs.push({
        id: `notif-${o.orderId}`,
        orderId: o.orderId,
        companyCode: o.companyCode,
        companyName: o.companyName,
        customerName: custName,
        customerEmail: o.customerEmail || '',
        customerPhone: o.customerPhone || '',
        channel: o.channel || 'Both',
        locationName: o.locationName || o.locationCode,
        totalAmount: o.totalAmount || 0,
        totalItems: o.totalItems || 0,
        status: o.status || 'Pending',
        paymentStatus: o.paymentStatus || 'Unpaid',
        orderDate: o.orderDate || o.dateCreated || '',
        dateCreated: o.dateCreated || o.orderDate || '',
        createdBy: o.createdBy || '',
        isRead,
        title,
        message,
        timeAgo: this.formatTimeAgo(o.dateCreated || o.orderDate)
      });
    }

    // Sort newest first
    notifs.sort((a, b) => {
      const timeB = b.dateCreated ? new Date(b.dateCreated).getTime() : 0;
      const timeA = a.dateCreated ? new Date(a.dateCreated).getTime() : 0;
      return timeB - timeA;
    });
    this.notifications.set(notifs);
  }

  private formatTimeAgo(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (isNaN(diffSecs) || diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const user = this.account.getUserDetails();
      const isCustomer = user?.isCustomerAccount === true && !user?.isSellerAccount;
      const createdByFilter = isCustomer ? (user?.userName || user?.email) : undefined;
      await this.orderService.list(undefined, undefined, undefined, undefined, createdByFilter);
    } catch (err) {
      console.error('Failed to refresh order notifications:', err);
    } finally {
      this.loading.set(false);
    }
  }

  markAsRead(orderId: string): void {
    const norm = orderId.toUpperCase();
    this.readOrderIds.update(set => {
      const next = new Set(set);
      next.add(norm);
      return next;
    });
    this.savePersistedState();
    this.rebuildNotifications(this.orderService.orders());
  }

  markAsUnread(orderId: string): void {
    const norm = orderId.toUpperCase();
    this.readOrderIds.update(set => {
      const next = new Set(set);
      next.delete(norm);
      return next;
    });
    this.savePersistedState();
    this.rebuildNotifications(this.orderService.orders());
  }

  markAllAsRead(): void {
    const allIds = this.notifications().map(n => n.orderId.toUpperCase());
    this.readOrderIds.update(set => {
      const next = new Set(set);
      allIds.forEach(id => next.add(id));
      return next;
    });
    this.savePersistedState();
    this.rebuildNotifications(this.orderService.orders());
  }

  dismissNotification(orderId: string): void {
    const norm = orderId.toUpperCase();
    this.dismissedOrderIds.update(set => {
      const next = new Set(set);
      next.add(norm);
      return next;
    });
    this.savePersistedState();
    this.rebuildNotifications(this.orderService.orders());
  }

  clearAll(): void {
    const allIds = this.notifications().map(n => n.orderId.toUpperCase());
    this.dismissedOrderIds.update(set => {
      const next = new Set(set);
      allIds.forEach(id => next.add(id));
      return next;
    });
    this.savePersistedState();
    this.rebuildNotifications(this.orderService.orders());
  }

  private startPolling(): void {
    if (this.timerId) clearInterval(this.timerId);
    // Poll every 25 seconds for new orders
    this.timerId = setInterval(() => {
      this.refresh().catch(() => {});
    }, 25000);
  }
}
