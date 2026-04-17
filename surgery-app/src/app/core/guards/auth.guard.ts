import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const role   = localStorage.getItem('user_role');
  const email  = localStorage.getItem('user_email');

  if (!role || !email) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const router = inject(Router);
  const role   = localStorage.getItem('user_role') ?? '';

  if (!allowedRoles.includes(role)) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};