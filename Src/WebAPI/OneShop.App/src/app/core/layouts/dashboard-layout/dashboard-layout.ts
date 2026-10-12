import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { Sidebar } from '../components/sidebar/sidebar';
import { Footer } from '../components/footer/footer';
import { Theme, ThemeType } from '../../services/theme';
import { Access } from '../../services/access';
import { CartDrawer } from '../../../features/orders/cart-drawer/cart-drawer';
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

  userDetails: any = null;
  sidebarOpen = true;
  selectedTheme: ThemeType = 'light-theme';

  // screenKeys: multiple keys means "show if user has access to ANY of these"
  private allNavItems = [
    { label: 'Dashboard', screenKeys: ['Dashboard'], icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Masters', screenKeys: ['CompanyMaster', 'DivisionMaster', 'CustomerMaster'], icon: 'pi pi-sitemap', route: '/dashboard/masters' },
    { label: 'Items', screenKeys: ['Items'], icon: 'pi pi-box', route: '/dashboard/items' },
    { label: 'Inventory', screenKeys: ['Inventory'], icon: 'pi pi-database', route: '/dashboard/inventory' },
    { label: 'Orders', screenKeys: ['Orders'], icon: 'pi pi-shopping-cart', route: '/dashboard/orders' },
    { label: 'Notifications', screenKeys: ['Notifications', 'Orders'], icon: 'pi pi-bell', route: '/dashboard/notifications' },
    { label: 'Invoicing', screenKeys: ['Invoicing'], icon: 'pi pi-file', route: '/dashboard/invoicing' },
    { label: 'Reports', screenKeys: ['Reports'], icon: 'pi pi-chart-bar', route: '/dashboard/reports' },
    { label: 'Analytics', screenKeys: ['Analytics'], icon: 'pi pi-chart-line', route: '/dashboard/analytics' },
    { label: 'Users', screenKeys: ['Users'], icon: 'pi pi-user-edit', route: '/dashboard/users' },
    { label: 'Settings', screenKeys: ['Settings'], icon: 'pi pi-cog', route: '/dashboard/settings' },
    { label: 'Integrations', screenKeys: ['Integrations'], icon: 'pi pi-sync', route: '/dashboard/integrations' }
  ];

  private allTabItems = [
    { label: 'Dashboard', screenKey: 'Dashboard', route: '/dashboard' },
    { label: 'Orders', screenKey: 'Orders', route: '/dashboard/orders' },
    { label: 'Notifications', screenKey: 'Notifications', route: '/dashboard/notifications' },
    { label: 'Analytics', screenKey: 'Analytics', route: '/dashboard/analytics' },
    { label: 'Reports', screenKey: 'Reports', route: '/dashboard/reports' }
  ];

  sidebarItems = computed(() => {
    const isCustomer = this.userDetails?.isCustomerAccount && !this.userDetails?.isSellerAccount;
    const unread = this.notifService.unreadCount();

    return this.allNavItems
      .filter(i => {
        // For customers, notifications are embedded directly within Orders screen
        if (isCustomer && i.route === '/dashboard/notifications') {
          return false;
        }
        return this.access.hasAnyAccess(i.screenKeys);
      })
      .map(({ label, route, icon }) => {
        let displayLabel = label;
        let displayIcon = icon;
        let badge: number | undefined;

        if (route === '/dashboard/notifications' && unread > 0) {
          badge = unread;
        }

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
    const isCustomer = this.userDetails?.isCustomerAccount && !this.userDetails?.isSellerAccount;
    if (isCustomer) {
      return [
        { label: 'Catalog', route: '/dashboard' },
        { label: 'My Orders', route: '/dashboard/orders' }
      ];
    }
    return this.allTabItems
      .filter(i => this.access.hasAccess(i.screenKey))
      .map(({ label, route }) => ({ label, route }));
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
