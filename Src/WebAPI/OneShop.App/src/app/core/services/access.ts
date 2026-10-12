import { Injectable } from '@angular/core';

interface ScreenAccess {
  screen: { screen: string; threshold: number; isUnlimited: boolean };
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

@Injectable({ providedIn: 'root' })
export class Access {
  private screenAccess: ScreenAccess[] = [];

  constructor() {
    this.reload();
  }

  reload() {
    const accessStr = localStorage.getItem('screenAccess');
    this.screenAccess = accessStr ? JSON.parse(accessStr) : [];
  }

  private normalize(key: string): string {
    return key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  hasAccess(screenKey: string): boolean {
    const target = this.normalize(screenKey);
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);

        // CUSTOMER PERSONA: Customers have access to Catalog/Dashboard, Items (view-only), Orders, Notifications, Settings
        if (u.isCustomerAccount && !u.isSellerAccount) {
          return target === 'dashboard' || target === 'items' || target === 'itemmaster' || target === 'orders' || target === 'notifications' || target === 'settings';
        }

        // VENDOR B2C PERSONA: B2C vendors do NOT have access to Warehouse screens
        if (u.isSellerAccount && (u.vendorType === 'B2C' || u.vendorType === 'b2c')) {
          if (target === 'warehouse' || target === 'warehousemaster') {
            return false;
          }
        }

        if (u.isMainAccount) return true;
        if (target === 'notifications') return true;
      } catch { }
    }

    if (target === 'notifications') return true;

    if (!localStorage.getItem('screenAccess')) {
      return true;
    }

    const permission = this.screenAccess.find(
      item => this.normalize(item.screen?.screen ?? '') === target
    );
    return permission ? permission.canView : false;
  }

  hasAnyAccess(screenKeys: string[]): boolean {
    return screenKeys.some(key => this.hasAccess(key));
  }

  isCustomer(): boolean {
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        return !!(u.isCustomerAccount && !u.isSellerAccount);
      } catch { }
    }
    return false;
  }

  isVendor(): boolean {
    const userStr = localStorage.getItem('userDetails');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        return !!(u.isSellerAccount || u.isMainAccount);
      } catch { }
    }
    return true;
  }
}
