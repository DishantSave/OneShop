import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../services/notification.service';
import { OrderNotification } from '../models/notification.model';
import { Account } from '../../../core/services/account';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  templateUrl: './notification-list.html'
})
export class NotificationList implements OnInit {
  public notifService = inject(NotificationService);
  private router = inject(Router);
  private toast = inject(MessageService);
  private account = inject(Account);

  // User state
  currentUser = signal<any>(null);

  isCustomer = computed(() => {
    const u = this.currentUser();
    if (!u) return false;
    return u.isCustomerAccount === true && !u.isSellerAccount;
  });

  // Filter & Search states
  activeFilter = signal<'ALL' | 'UNREAD' | 'PENDING' | 'B2C' | 'B2B'>('ALL');
  searchQuery = signal<string>('');

  allNotifications = this.notifService.notifications;
  unreadCount = this.notifService.unreadCount;
  loading = this.notifService.loading;

  // Stats
  pendingFulfillmentCount = computed(() => {
    return this.allNotifications().filter(n => n.status.toLowerCase() === 'pending').length;
  });

  totalVolume = computed(() => {
    return this.allNotifications().reduce((sum, n) => sum + (n.totalAmount || 0), 0);
  });

  // Filtered Notifications list
  filteredNotifications = computed(() => {
    let list = this.allNotifications();
    const filter = this.activeFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (filter === 'UNREAD') {
      list = list.filter(n => !n.isRead);
    } else if (filter === 'PENDING') {
      list = list.filter(n => n.status.toLowerCase() === 'pending');
    } else if (filter === 'B2C') {
      list = list.filter(n => n.channel.toUpperCase() === 'B2C' || n.channel.toUpperCase() === 'BOTH');
    } else if (filter === 'B2B') {
      list = list.filter(n => n.channel.toUpperCase() === 'B2B');
    }

    if (q) {
      list = list.filter(n =>
        n.orderId.toLowerCase().includes(q) ||
        n.customerName.toLowerCase().includes(q) ||
        n.customerEmail.toLowerCase().includes(q) ||
        n.companyCode.toLowerCase().includes(q) ||
        (n.locationName && n.locationName.toLowerCase().includes(q))
      );
    }

    return list;
  });

  ngOnInit() {
    this.currentUser.set(this.account.getUserDetails());
    this.notifService.refresh().catch(console.error);
  }

  setFilter(filter: 'ALL' | 'UNREAD' | 'PENDING' | 'B2C' | 'B2B') {
    this.activeFilter.set(filter);
  }

  markAsRead(n: OrderNotification, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.markAsRead(n.orderId || n.id);
  }

  toggleRead(n: OrderNotification, event?: Event) {
    if (event) event.stopPropagation();
    if (n.isRead) {
      this.notifService.markAsUnread(n.orderId || n.id);
    } else {
      this.notifService.markAsRead(n.orderId || n.id);
    }
  }

  markAllAsRead() {
    this.notifService.markAllAsRead();
    this.toast.add({ severity: 'success', summary: 'Notifications', detail: 'All notifications marked as read.' });
  }

  dismiss(n: OrderNotification, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.dismissNotification(n.orderId || n.id);
  }

  clearAll() {
    this.notifService.clearAll();
    this.toast.add({ severity: 'info', summary: 'Notifications Cleared', detail: 'All notifications have been cleared.' });
  }

  refresh() {
    this.notifService.refresh().then(() => {
      this.toast.add({ severity: 'info', summary: 'Refreshed', detail: 'Checked for new orders.' });
    });
  }

  goToOrder(n: OrderNotification) {
    this.notifService.markAsRead(n.orderId);
    this.router.navigate(['/dashboard/orders'], { queryParams: { orderId: n.orderId } });
  }

  goToFulfill(n: OrderNotification, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.markAsRead(n.orderId);
    this.router.navigate(['/dashboard/orders'], { queryParams: { orderId: n.orderId } });
  }
}
