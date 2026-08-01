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
    const permission = this.screenAccess.find(
      item => this.normalize(item.screen?.screen ?? '') === target
    );
    return permission ? permission.canView : false;
  }

  hasAnyAccess(screenKeys: string[]): boolean {
    return screenKeys.some(key => this.hasAccess(key));
  }
}
