import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { CustomerRoutingModule } from './customer-routing-module';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { OrderDetailsPageComponent } from './pages/order-details-page/order-details-page.component';
import { OrdersListPageComponent } from './pages/orders-list-page/orders-list-page.component';

@NgModule({
  declarations: [CartPageComponent, OrderDetailsPageComponent, OrdersListPageComponent],
  imports: [CommonModule, FormsModule, SharedModule, LayoutModule, CustomerRoutingModule],
})
export class CustomerModule {}
