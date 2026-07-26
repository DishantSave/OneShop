import { Routes } from '@angular/router';

import { PublicLayout } from './core/layouts/public-layout/public-layout';
import { Login } from './features/authentication/login/login';
import { Register } from './features/authentication/register/register';
import { VendorRegister } from './features/authentication/vendor-register/vendor-register';

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
  }
];
