import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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

  /**
   * Placeholder: le bouton menu ne fait rien pour l'instant.
   * On garde une méthode pour éviter un (click) vide.
   */
  onMenuClick(): void {
    // no-op
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
