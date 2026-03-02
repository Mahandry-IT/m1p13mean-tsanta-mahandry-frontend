import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home-module').then(m => m.HomeModule) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule) },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule) },
  { path: 'profile', loadChildren: () => import('./features/profile/profile-module').then(m => m.ProfileModule) },
  { path: 'users', loadChildren: () => import('./features/users/users-module').then(m => m.UsersModule) },
  { path: 'admin/stores', loadChildren: () => import('./features/stores/stores-module').then(m => m.StoresModule) },
  { path: 'manager/stores', loadChildren: () => import('./features/stores/stores-module').then(m => m.StoresModule) },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
