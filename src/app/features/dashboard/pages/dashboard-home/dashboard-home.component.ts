import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss'],
  standalone: false
})
export class DashboardHomeComponent implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Utiliser setTimeout pour s'assurer que le routing se fait après l'initialisation
    setTimeout(() => this.redirectBasedOnRole(), 0);
  }

  private redirectBasedOnRole(): void {
    const user: any = this.authService.getUser();
    console.log('DashboardHome - Full user object:', JSON.stringify(user));
    
    const roleName = user?.role?.value || '';
    console.log('DashboardHome - Role name:', roleName);

    if (roleName === 'Administrator') {
      console.log('Redirecting to /dashboard/admin');
      this.router.navigateByUrl('/dashboard/admin');
    } else if (roleName === 'Manager') {
      console.log('Redirecting to /dashboard/manager');
      this.router.navigateByUrl('/dashboard/manager');
    } else {
      console.log('No matching role found. Role was:', roleName);
    }
  }
}

