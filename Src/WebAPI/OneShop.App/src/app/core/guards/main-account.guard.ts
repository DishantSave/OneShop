import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Access } from '../services/access';

export const mainAccountGuard: CanActivateFn = () => {
  const router = inject(Router);
  const access = inject(Access);
  access.reload();

  if (!access.hasAccess('Users')) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
