import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Access } from '../services/access';

export const screenGuard = (requiredScreen: string, fallbackUrl = '/dashboard'): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const access = inject(Access);
    access.reload();

    if (!access.hasAccess(requiredScreen)) {
      router.navigateByUrl(fallbackUrl);
      return false;
    }

    return true;
  };
};
