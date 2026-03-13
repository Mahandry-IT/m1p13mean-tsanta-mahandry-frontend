import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { FormsModule } from '@angular/forms';
import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';

@NgModule({
  declarations: [DashboardHomeComponent, AdminDashboardComponent, ManagerDashboardComponent],
  imports: [CommonModule, SharedModule, LayoutModule, FormsModule, DashboardRoutingModule]
})
export class DashboardModule {}
