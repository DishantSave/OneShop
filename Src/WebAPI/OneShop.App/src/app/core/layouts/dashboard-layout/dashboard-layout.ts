import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { Sidebar } from '../components/sidebar/sidebar';
import { Footer } from '../components/footer/footer';
import { Theme, ThemeType } from '../../services/theme';
import { Access } from '../../services/access';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Sidebar, Footer],
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout implements OnInit {
  private router = inject(Router);
  private themeService = inject(Theme);
  private access = inject(Access);

  userDetails: any = null;
  sidebarOpen = true;
  selectedTheme: ThemeType = 'light-theme';

  sidebarItems: { label: string; route: string; icon: string }[] = [];
  tabItems: { label: string; route: string }[] = [];

  // screenKeys: multiple keys means "show if user has access to ANY of these"
  private allNavItems = [
    { label: 'Dashboard', screenKeys: ['Dashboard'], icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Masters', screenKeys: ['CompanyMaster', 'DivisionMaster', 'CustomerMaster'], icon: 'pi pi-sitemap', route: '/dashboard/masters' },
    { label: 'Items', screenKeys: ['Items'], icon: 'pi pi-box', route: '/dashboard/items' },
    { label: 'Inventory', screenKeys: ['Inventory'], icon: 'pi pi-database', route: '/dashboard/inventory' },
    { label: 'Orders', screenKeys: ['Orders'], icon: 'pi pi-shopping-cart', route: '/dashboard/orders' },
    { label: 'Invoicing', screenKeys: ['Invoicing'], icon: 'pi pi-file', route: '/dashboard/invoicing' },
    { label: 'Reports', screenKeys: ['Reports'], icon: 'pi pi-chart-bar', route: '/dashboard/reports' },
    { label: 'Analytics', screenKeys: ['Analytics'], icon: 'pi pi-chart-line', route: '/dashboard/analytics' },
    { label: 'Users', screenKeys: ['Users'], icon: 'pi pi-user-edit', route: '/dashboard/users' },
    { label: 'Settings', screenKeys: ['Settings'], icon: 'pi pi-cog', route: '/dashboard/settings' },
    { label: 'Integrations', screenKeys: ['Integrations'], icon: 'pi pi-sync', route: '/dashboard/integrations' }
  ];

  private allTabItems = [
    { label: 'Dashboard', screenKey: 'Dashboard', route: '/dashboard' },
    { label: 'Analytics', screenKey: 'Analytics', route: '/dashboard/analytics' },
    { label: 'Reports', screenKey: 'Reports', route: '/dashboard/reports' }
  ];

  ngOnInit() {
    const userStr = localStorage.getItem('userDetails');
    if (userStr) this.userDetails = JSON.parse(userStr);

    this.access.reload();

    this.sidebarItems = this.allNavItems
      .filter(i => this.access.hasAnyAccess(i.screenKeys))
      .map(({ label, route, icon }) => ({ label, route, icon }));

    this.tabItems = this.allTabItems
      .filter(i => this.access.hasAccess(i.screenKey))
      .map(({ label, route }) => ({ label, route }));

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
