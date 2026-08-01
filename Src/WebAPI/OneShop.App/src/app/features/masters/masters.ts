import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Access } from '../../core/services/access';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './masters.html'
})
export class Masters implements OnInit {
  private access = inject(Access);

  private allMenuItems = [
    { label: 'Company', icon: 'pi pi-building', route: 'company', screenKey: 'CompanyMaster' },
    { label: 'Division', icon: 'pi pi-sitemap', route: 'division', screenKey: 'DivisionMaster' },
    { label: 'Customer', icon: 'pi pi-users', route: 'customers', screenKey: 'CustomerMaster' }
  ];

  menuItems: { label: string; icon: string; route: string }[] = [];

  ngOnInit() {
    this.menuItems = this.allMenuItems
      .filter(i => this.access.hasAccess(i.screenKey))
      .map(({ label, icon, route }) => ({ label, icon, route }));
  }
}
