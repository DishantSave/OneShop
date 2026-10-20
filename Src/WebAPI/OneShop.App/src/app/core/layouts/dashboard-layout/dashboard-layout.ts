import { Component, OnInit, OnDestroy, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Navbar } from '../components/navbar/navbar';
import { Sidebar } from '../components/sidebar/sidebar';
import { Footer } from '../components/footer/footer';
import { Theme, ThemeType } from '../../services/theme';
import { Access } from '../../services/access';
import { CartDrawer } from '../../../features/orders/cart-drawer/cart-drawer';
import { CartService } from '../../../features/orders/services/cart.service';
import { NotificationService } from '../../../features/notifications/services/notification.service';
import { EmbeddedDatabaseService } from '../../services/embedded-database.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Sidebar, Footer, CartDrawer],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout implements OnInit, OnDestroy {
  private router = inject(Router);
  private themeService = inject(Theme);
  private access = inject(Access);
  public notifService = inject(NotificationService);
  public cartService = inject(CartService);
  public embeddedDb = inject(EmbeddedDatabaseService);

  cartCount = this.cartService.cartCount;

  openCart() {
    this.cartService.openDrawer();
  }

  userDetails: any = null;
  sidebarOpen = true;
  selectedTheme: ThemeType = 'light-theme';

  // Mobile responsiveness signals
  isMobile = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  mobileMenuOpen = signal<boolean>(false);
  private routerSub?: Subscription;

  // Exact sidebar sequence for Master/Vendor login:
  // 1. Dashboard, 2. Orders, 3. Items, 4. Inventory, 5. Masters, 6. Users, 7. API Connectivity, 8. Settings
  private allNavItems = [
    { label: 'Dashboard', screenKeys: ['Dashboard'], icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Orders', screenKeys: ['Orders'], icon: 'pi pi-shopping-cart', route: '/dashboard/orders' },
    { label: 'Items', screenKeys: ['Items'], icon: 'pi pi-box', route: '/dashboard/items' },
    { label: 'Inventory', screenKeys: ['Inventory'], icon: 'pi pi-database', route: '/dashboard/inventory' },
    { label: 'Masters', screenKeys: ['CompanyMaster', 'DivisionMaster', 'CustomerMaster', 'Warehouse', 'Tax', 'Discounts', 'DeliveryPartner'], icon: 'pi pi-sitemap', route: '/dashboard/masters' },
    { label: 'Users', screenKeys: ['Users'], icon: 'pi pi-users', route: '/dashboard/users' },
    { label: 'API Connectivity', screenKeys: ['Dashboard', 'Settings'], icon: 'pi pi-code', route: '/dashboard/api-connectivity' },
    { label: 'Settings', screenKeys: ['Settings'], icon: 'pi pi-cog', route: '/dashboard/settings' }
  ];

  currentUser = signal<any>(this.getStoredUser());

  private getStoredUser(): any {
    try {
      const userStr = localStorage.getItem('userDetails');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isCustomer = computed(() => {
    const u = this.currentUser() || this.userDetails;
    return !!(u?.isCustomerAccount && !u?.isSellerAccount);
  });

  sidebarItems = computed(() => {
    const isCustomer = this.isCustomer();
    const unread = this.notifService.unreadCount();

    return this.allNavItems
      .filter(i => {
        if (isCustomer && i.route === '/dashboard/api-connectivity') {
          return false;
        }
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

  tabItems = computed(() => {
    if (this.isCustomer()) {
      return [];
    }
    return [
      { label: 'Global Products', route: '/dashboard/products' },
      { label: 'Analytics', route: '/dashboard/analytics' },
      { label: 'Tutorials', route: '/dashboard/tutorials' }
    ];
  });

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 768;
      this.isMobile.set(mobile);
      if (!mobile) {
        this.mobileMenuOpen.set(false);
      }
    }
  }

  ngOnInit() {
    this.userDetails = this.getStoredUser();
    this.currentUser.set(this.userDetails);

    this.access.reload();

    this.themeService.theme$.subscribe(theme => {
      this.selectedTheme = theme;
    });

    // Close mobile drawer upon router navigation
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile()) {
          this.mobileMenuOpen.set(false);
        }
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar() {
    if (this.isMobile()) {
      this.mobileMenuOpen.update(v => !v);
    } else {
      this.sidebarOpen = !this.sidebarOpen;
    }
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
