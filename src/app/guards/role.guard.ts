import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthSentinel } from '../sentinels/auth.sentinel';
import { Role } from '../models/wellspace.model';

const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const auth = inject(AuthSentinel);
    const router = inject(Router);
    return auth.account$.pipe(
      take(1),
      map((account) =>
        account && (account as { role: string }).role === role
          ? true
          : router.createUrlTree(['/login']),
      ),
    );
  };

export const clientGuard = roleGuard('client');
export const therapistGuard = roleGuard('therapist');
