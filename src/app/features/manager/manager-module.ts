import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { ManagerRoutingModule } from './manager-routing-module';
import { ManagerOrdersListPageComponent } from './pages/orders-list-page/orders-list-page.component';
import { ManagerOrderDetailsPageComponent } from './pages/order-details-page/order-details-page.component';

@NgModule({
  declarations: [ManagerOrdersListPageComponent, ManagerOrderDetailsPageComponent],
  imports: [CommonModule, FormsModule, SharedModule, LayoutModule, ManagerRoutingModule],
})
export class ManagerModule {}
