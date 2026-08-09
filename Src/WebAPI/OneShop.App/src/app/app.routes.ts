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
            path: 'company',
            component: CompanyMaster,
            children: [
              { path: '', component: CompanyList },
              { path: 'new', component: CompanyForm },
              { path: ':code', component: CompanyForm }
            ]
          },
          // { path: 'division', component: DivisionMaster },
          // { path: 'customers', component: CustomerMaster }
          // ...division, customers, etc.
        ]
      }
      // add more child routes here as you build them out:
      // { path: 'customers', component: CustomerMaster },
      // { path: 'items', component: ItemMaster },
      // { path: 'orders', component: Orders },
      // ...
    ]
  }
];
