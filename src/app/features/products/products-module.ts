import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsRoutingModule } from './products-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { ProductsPageComponent } from './pages/products-page/products-page.component';

@NgModule({
  declarations: [ProductsPageComponent],
  imports: [CommonModule, SharedModule, ProductsRoutingModule],
})
export class ProductsModule {}

