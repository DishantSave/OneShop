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
import { mainAccountGuard } from './core/guards/main-account.guard';

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
      /*{
        path: '',
        component: DashboardLayout, // whatever your default dashboard view component is called
      },*/
      {
        path: 'settings',
        component: Setting
      },
      {
        path: 'masters',
        component: Masters,
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
          // { path: 'customers', component: CustomerMaster }
          // ...customers, etc.
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
