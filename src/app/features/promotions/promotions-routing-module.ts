import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PromotionListComponent } from './pages/promotion-list/promotion-list.component';

const routes: Routes = [
  { path: '', component: PromotionListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PromotionsRoutingModule {}

