import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { Sidebar } from '../components/sidebar/sidebar';
import { Footer } from '../components/footer/footer';
import { Theme, ThemeType } from '../../services/theme';
import { Access } from '../../services/access';
import { CartDrawer } from '../../../features/orders/cart-drawer/cart-drawer';
import { CartService } from '../../../features/orders/services/cart.service';
import { NotificationService } from '../../../features/notifications/services/notification.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Sidebar, Footer, CartDrawer],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout implements OnInit {
  private router = inject(Router);
  private themeService = inject(Theme);
  private access = inject(Access);
  public notifService = inject(NotificationService);
  public cartService = inject(CartService);

  cartCount = this.cartService.cartCount;

  openCart() {
    this.cartService.openDrawer();
  }

  userDetails: any = null;
  sidebarOpen = true;
  selectedTheme: ThemeType = 'light-theme';

  // Exact sidebar sequence for Master/Vendor login:
  // 1. Dashboard, 2. Orders, 3. Items, 4. Inventory, 5. Masters, 6. Users, 7. Settings
  // (Notifications & Logout remain at bottom)
  private allNavItems = [
    { label: 'Dashboard', screenKeys: ['Dashboard'], icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Orders', screenKeys: ['Orders'], icon: 'pi pi-shopping-cart', route: '/dashboard/orders' },
    { label: 'Items', screenKeys: ['Items'], icon: 'pi pi-box', route: '/dashboard/items' },
    { label: 'Inventory', screenKeys: ['Inventory'], icon: 'pi pi-database', route: '/dashboard/inventory' },
    { label: 'Masters', screenKeys: ['CompanyMaster', 'DivisionMaster', 'CustomerMaster', 'Warehouse', 'Tax', 'Discounts', 'DeliveryPartner'], icon: 'pi pi-sitemap', route: '/dashboard/masters' },
    { label: 'Users', screenKeys: ['Users'], icon: 'pi pi-users', route: '/dashboard/users' },
    { label: 'Settings', screenKeys: ['Settings'], icon: 'pi pi-cog', route: '/dashboard/settings' }
  ];

  sidebarItems = computed(() => {
    const isCustomer = this.userDetails?.isCustomerAccount && !this.userDetails?.isSellerAccount;
    const unread = this.notifService.unreadCount();

    return this.allNavItems
      .filter(i => {
        return this.access.hasAnyAccess(i.screenKeys);
      })
      .map(({ label, route, icon }) => {
        let displayLabel = label;
        let displayIcon = icon;
        let badge: number | undefined;

        if (isCustomer) {
          if (route === '/dashboard') {
            displayLabel = 'Catalog & Shop';
            displayIcon = 'pi pi-th-large';
          }
          if (route === '/dashboard/items') {
            displayLabel = 'Products Catalog';
            displayIcon = 'pi pi-box';
          }
          if (route === '/dashboard/orders') {
            displayLabel = 'My Orders';
            displayIcon = 'pi pi-shopping-bag';
            if (unread > 0) {
              badge = unread;
            }
          }
          if (route === '/dashboard/settings') {
            displayLabel = 'Addresses & Profile';
            displayIcon = 'pi pi-map-marker';
          }
        }
        return { label: displayLabel, route, icon: displayIcon, badge };
      });
  });

  // Top Menu Option: 1st Tab: Global Products, 2nd Tab: Analytics, 3rd Tab: Tutorials
  tabItems = computed(() => {
    const isCustomer = this.userDetails?.isCustomerAccount && !this.userDetails?.isSellerAccount;
    if (isCustomer) {
      return [
        { label: 'Global Products', route: '/dashboard/products' },
        { label: 'My Orders', route: '/dashboard/orders' }
      ];
    }
    return [
      { label: 'Global Products', route: '/dashboard/products' },
      { label: 'Analytics', route: '/dashboard/analytics' },
      { label: 'Tutorials', route: '/dashboard/tutorials' }
    ];
  });

  ngOnInit() {
    const userStr = localStorage.getItem('userDetails');
    if (userStr) this.userDetails = JSON.parse(userStr);

    this.access.reload();

    this.themeService.theme$.subscribe(theme => {
      this.selectedTheme = theme;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
