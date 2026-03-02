import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { MyProductRoutingModule } from './my-product-routing-module';
import { MyProductsPageComponent } from './pages/my-products-page/my-products-page.component';

@NgModule({
  declarations: [MyProductsPageComponent],
  imports: [CommonModule, SharedModule, LayoutModule, MyProductRoutingModule],
})
export class MyProductModule {}

