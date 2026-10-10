import { Routes } from '@angular/router';

import { PublicLayout } from './core/layouts/public-layout/public-layout';
import { Login } from './features/authentication/login/login';
import { Register } from './features/authentication/register/register';
import { VendorRegister } from './features/authentication/vendor-register/vendor-register';

import { DashboardLayout } from './core/layouts/dashboard-layout/dashboard-layout';
import { Setting } from './features/settings/settings';
import { Masters } from './features/masters/masters';
import { CompanyMaster } from './features/company/company-master/company-master';
import { CompanyForm } from './features/company/company-form/company-form';
import { CompanyList } from './features/company/company-list/company-list';
import { StoreMaster } from './features/store/store-master/store-master';
import { StoreForm } from './features/store/store-form/store-form';
import { StoreList } from './features/store/store-list/store-list';
import { UserMaster } from './features/user/user-master/user-master';
import { UserList } from './features/user/user-list/user-list';
import { UserForm } from './features/user/user-form/user-form';
import { WarehouseMaster } from './features/warehouse/warehouse-master/warehouse-master';
import { WarehouseList } from './features/warehouse/warehouse-list/warehouse-list';
import { WarehouseForm } from './features/warehouse/warehouse-form/warehouse-form';
import { ColourMaster } from './features/colour/colour-master/colour-master';
import { SizeMaster } from './features/size/size-master/size-master';
import { ItemMaster } from './features/item/item-master/item-master';
import { ItemList } from './features/item/item-list/item-list';
import { ItemForm } from './features/item/item-form/item-form';
import { InventoryMaster } from './features/inventory/inventory-master/inventory-master';
import { InventoryList } from './features/inventory/inventory-list/inventory-list';
import { mainAccountGuard } from './core/guards/main-account.guard';
import { screenGuard } from './core/guards/screen.guard';
import { DashboardHome } from './features/dashboard-home/dashboard-home';
import { OrderMaster } from './features/orders/order-master/order-master';
import { OrderList } from './features/orders/order-list/order-list';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,

    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },

      {
        path: 'login',
        component: Login
      },

      {
        path: 'register',
        component: Register
      },

      {
        path: 'register/vendor',
        component: VendorRegister
      }
    ]
  },
  {
    path: 'dashboard',
    component: DashboardLayout,
    // TODO: Add an AuthGuard here later to secure the route
    children: [
      {
        path: '',
        component: DashboardHome
      },
      {
        path: 'orders',
        component: OrderMaster,
        children: [
          { path: '', component: OrderList }
        ]
      },
      {
        path: 'settings',
        component: Setting
      },
      {
        path: 'masters',
        component: Masters,
        canActivate: [screenGuard('CompanyMaster')],
        children: [
          {
            path: '',
            redirectTo: 'company',
            pathMatch: 'full'
          },
          {
            path: 'company',
            component: CompanyMaster,
            children: [
              { path: '', component: CompanyList },
              { path: 'new', component: CompanyForm },
              { path: ':code', component: CompanyForm }
            ]
          },
          {
            path: 'store',
            component: StoreMaster,
            children: [
              { path: '', component: StoreList },
              { path: 'new', component: StoreForm },
              { path: ':companyCode/:code', component: StoreForm }
            ]
          },
          {
            path: 'division',
            redirectTo: 'store',
            pathMatch: 'full'
          },
          {
            path: 'warehouse',
            component: WarehouseMaster,
            canActivate: [screenGuard('Warehouse', '/dashboard/masters')],
            children: [
              { path: '', component: WarehouseList },
              { path: 'new', component: WarehouseForm },
              { path: ':companyCode/:code', component: WarehouseForm }
            ]
          },
          {
            path: 'colour',
            component: ColourMaster
          },
          {
            path: 'color',
            redirectTo: 'colour',
            pathMatch: 'full'
          },
          {
            path: 'size',
            component: SizeMaster
          },
          {
            path: 'tax',
            loadComponent: () => import('./features/tax/tax-master/tax-master').then(m => m.TaxMaster)
          },
          {
            path: 'discounts',
            loadComponent: () => import('./features/discounts/promo-master/promo-master').then(m => m.PromoMaster)
          }
          // { path: 'customers', component: CustomerMaster }
          // ...customers, etc.
        ]
      },
      {
        path: 'items',
        component: ItemMaster,
        canActivate: [screenGuard('Items')],
        children: [
          { path: '', component: ItemList },
          { path: 'new', component: ItemForm },
          { path: ':companyCode/:itemNumber', component: ItemForm }
        ]
      },
      {
        path: 'inventory',
        component: InventoryMaster,
        canActivate: [screenGuard('Inventory')],
        children: [
          { path: '', component: InventoryList }
        ]
      },
      {
        path: 'users',
        component: UserMaster,
        canActivate: [mainAccountGuard],
        children: [
          { path: '', component: UserList },
          { path: 'new', component: UserForm },
          { path: ':userName', component: UserForm }
        ]
      }
    ]
  }
];
