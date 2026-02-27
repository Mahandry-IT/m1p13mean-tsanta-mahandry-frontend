import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AuthService, UserResponse } from '../../../core/services/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { MenuModalService } from '../menu-modal/menu-modal.service';
import { firstValueFrom } from 'rxjs';

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
      order: (m.order ?? null) as number | null,
      badge: (m.badgeCount ?? m.badgeText ?? m.badge ?? null) as string | number | null,
    }));

    await firstValueFrom(this.menuModal.openWithItems(items, 'Menu'));
  }

  onEditProfile(): void {
    // no-op (sera câblé plus tard)
  }

  onLogout(): void {
    // no-op (sera câblé plus tard)
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
