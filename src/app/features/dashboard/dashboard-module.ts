import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { SharedModule } from '../../shared/shared-module';
import { LayoutModule } from '../../layout/layout-module';

@NgModule({
  declarations: [DashboardHomeComponent],
  imports: [
    CommonModule,
    SharedModule,
    LayoutModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
