import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { OrderDetailsPageComponent } from './pages/order-details-page/order-details-page.component';
import { OrdersListPageComponent } from './pages/orders-list-page/orders-list-page.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'cart' },
  { path: 'cart', component: CartPageComponent },
  { path: 'orders', component: OrdersListPageComponent },
  { path: 'order', component: OrderDetailsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerRoutingModule {}
