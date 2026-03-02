import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuyProductsPageComponent } from './pages/buy-products-page/buy-products-page.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: BuyProductsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuyProductRoutingModule {}

