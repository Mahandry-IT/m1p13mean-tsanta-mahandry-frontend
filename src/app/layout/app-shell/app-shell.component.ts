import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { NavbarUser } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  constructor(private readonly auth: AuthService) {}

  get navbarUser(): NavbarUser | null {
    const u = this.auth.getUser<{
      username?: string | null;
      profile?: {
        avatarUrl?: string | null;
      } | null;
    }>();

    if (!u) return null;

    return {
      username: u.username ?? null,
      avatarUrl: u.profile?.avatarUrl ?? null,
    };
  }
}
