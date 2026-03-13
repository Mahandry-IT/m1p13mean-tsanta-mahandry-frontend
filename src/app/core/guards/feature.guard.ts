import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class FeatureGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredFeature = route.data && (route.data as any)['feature'] as string | undefined;
    if (!requiredFeature) {
      return true; // pas de feature requise
    }

    const user: any = (this.auth && (this.auth.getUser ? this.auth.getUser() : null)) || null;

    const hasFeature = !!(
      (user && Array.isArray(user.features) && user.features.includes(requiredFeature)) ||
      (user && user.role && Array.isArray(user.role.features) && user.role.features.some((f: any) => f.name === requiredFeature || f === requiredFeature))
    );

    if (!hasFeature) {
      this.router.navigateByUrl('/');
      return false;
    }

    return true;
  }
}
