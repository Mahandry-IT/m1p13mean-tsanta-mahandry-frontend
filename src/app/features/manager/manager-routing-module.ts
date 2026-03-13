import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManagerOrdersListPageComponent } from './pages/orders-list-page/orders-list-page.component';
import { ManagerOrderDetailsPageComponent } from './pages/order-details-page/order-details-page.component';

const routes: Routes = [
  { path: 'orders', component: ManagerOrdersListPageComponent },
  { path: 'orders/:id', component: ManagerOrderDetailsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManagerRoutingModule {}
