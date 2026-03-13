import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';

const routes: Routes = [
  { path: '', component: DashboardHomeComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'manager', component: ManagerDashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
