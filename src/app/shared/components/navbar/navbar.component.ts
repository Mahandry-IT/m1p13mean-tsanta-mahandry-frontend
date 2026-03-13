import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, UserResponse } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { MenuModalService } from '../menu-modal/menu-modal.service';
import { ToastService } from '../../../core/services/toast.service';

export interface NavbarUser {
  username?: string | null;
  avatarUrl?: string | null;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  @Input() user: NavbarUser | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly menus: MenuService,
    private readonly menuModal: MenuModalService,
    private readonly router: Router,
    private readonly toast: ToastService,
  ) {}

  /**
   * Ouvre le menu (modal) et charge les entrées via GET /api/menus/role/:roleId
   */
  async onMenuClick(): Promise<void> {
    const user = this.auth.getUser<UserResponse>();
    const roleId = (user?.roleId ?? '').trim();
    if (!roleId) {
      // pas de rôle => pas de menus
      await firstValueFrom(this.menuModal.openWithItems([], 'Menu'));
      return;
    }

    const res = await firstValueFrom(this.menus.getMenusByRole(roleId));
    const items = (res.data ?? []).map((m) => ({
      id: m._id,
      label: String(m.label ?? ''),
      path: String(m.path ?? ''),
      icon: (m.icon ?? null) as string | null,
      parentId: (m.parentId ?? null) as string | null,
      order: (m.order ?? null) as number | null,
      badge: (m.badgeCount ?? m.badgeText ?? m.badge ?? null) as string | number | null,
    }));

    // Open menu modal and wait for selected path
    const selectedPath = await firstValueFrom(this.menuModal.openWithItems(items, 'Menu')) as string | null;
    if (!selectedPath) return;

    // Try navigating to the exact path returned by backend
    try {
      const ok = await this.router.navigateByUrl(selectedPath).catch(() => false);
      if (ok) return;
    } catch {
      // ignore and try fallback
    }

    // Fallback: try without leading slash (some routes are declared without it)
    const alt = selectedPath.replace(/^\//, '');
    try {
      await this.router.navigateByUrl(alt);
      return;
    } catch {
      // final failure
    }

    this.toast.error('Impossible de naviguer vers la page demandée.');
  }

  onEditProfile(): void {
    this.router.navigateByUrl('/profile/edit');
  }

  async onLogout(): Promise<void> {
    await this.router.navigateByUrl('/auth/logout');
  }

  get displayName(): string {
    return (this.user?.username ?? '').trim() || 'Utilisateur';
  }

  get hasAvatar(): boolean {
    return !!(this.user?.avatarUrl && this.user.avatarUrl.trim());
  }

  /** Initiales à afficher quand il n'y a pas d'avatar (ex: "Mahandry M") */
  get initials(): string {
    const name = this.displayName;

    // split sur espaces multiples
    const parts = name
      .split(/\s+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) return 'U';

    // 2 lettres max : 1ère lettre du 1er mot + 1ère lettre du dernier mot
    const first = parts[0][0] ?? '';
    const last = (parts.length > 1 ? parts[parts.length - 1][0] : '') ?? '';

    const result = `${first}${last}`.toUpperCase();
    return result || 'U';
  }

  get avatarSrc(): string {
    // utilisé uniquement si hasAvatar
    return (this.user?.avatarUrl ?? '').trim();
  }
}
