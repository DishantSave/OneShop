import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Theme, ThemeType } from '../../../../core/services/theme';
import { CartService } from '../../../../features/orders/services/cart.service';
import { NotificationService } from '../../../../features/notifications/services/notification.service';
import { OrderNotification } from '../../../../features/notifications/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html'
})
export class Navbar implements OnInit, OnDestroy {
  private themeService = inject(Theme);
  private router = inject(Router);
  public cartService = inject(CartService);
  public notifService = inject(NotificationService);
  private themeSub?: Subscription;

  cartCount = this.cartService.cartCount;
  unreadNotifs = this.notifService.unreadCount;
  recentNotifs = this.notifService.recentNotifications;

  notifDropdownOpen = signal<boolean>(false);

  @Input() tabItems: { label: string; route: string }[] = [];
  @Input() logoUrl?: string;

  @Output() toggleSidebar = new EventEmitter<void>();

  openCart() {
    this.cartService.openDrawer();
  }

  toggleNotifDropdown() {
    this.notifDropdownOpen.update(v => !v);
  }

  closeNotifDropdown() {
    this.notifDropdownOpen.set(false);
  }

  goToOrder(notif: OrderNotification, event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.markAsRead(notif.orderId || notif.id);
    this.notifDropdownOpen.set(false);
    this.router.navigate(['/dashboard/orders'], { queryParams: { orderId: notif.orderId } });
  }

  viewAllNotifications() {
    this.notifDropdownOpen.set(false);
    this.router.navigate(['/dashboard/notifications']);
  }

  markAllAsRead(event?: Event) {
    if (event) event.stopPropagation();
    this.notifService.markAllAsRead();
  }

  currentTheme: ThemeType = 'light-theme';

  private themeLogos: Record<ThemeType, string> = {
    'light-theme': 'images/logo-light.png',
    'dark-theme': 'images/logo-dark.png',
    'neonocean-theme': 'images/logo-neonocean.png',
    'solarflare-theme': 'images/logo-solarflare.png',
    'sunsetblush-theme': 'images/logo-sunsetblush.png'
  };

  ngOnInit() {
    this.themeSub = this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnDestroy() {
    this.themeSub?.unsubscribe();
  }

  get resolvedLogo(): string {
    return this.logoUrl || this.themeLogos[this.currentTheme];
  }
}
