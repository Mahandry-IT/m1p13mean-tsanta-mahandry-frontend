import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { PromotionsRoutingModule } from './promotions-routing-module';
import { PromotionListComponent } from './pages/promotion-list/promotion-list.component';
import { PromotionFormComponent } from './pages/promotion-form/promotion-form.component';

@NgModule({
  declarations: [PromotionListComponent, PromotionFormComponent],
  imports: [CommonModule, SharedModule, LayoutModule, PromotionsRoutingModule],
})
export class PromotionsModule {}

