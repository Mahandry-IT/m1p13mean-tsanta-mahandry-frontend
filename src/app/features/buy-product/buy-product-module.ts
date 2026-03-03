import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { BuyProductRoutingModule } from './buy-product-routing-module';
import { BuyProductsPageComponent } from './pages/buy-products-page/buy-products-page.component';
import { BuyProductsFormComponent } from './pages/buy-products-form/buy-products-form.component';

@NgModule({
  declarations: [BuyProductsPageComponent, BuyProductsFormComponent],
  imports: [CommonModule, SharedModule, LayoutModule, BuyProductRoutingModule],
})
export class BuyProductModule {}

