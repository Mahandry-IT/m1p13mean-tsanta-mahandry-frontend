import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsRoutingModule } from './products-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { ProductsPageComponent } from './pages/products-page/products-page.component';
import { ProductFormComponent } from './pages/product-form/product-form.component';
import {LayoutModule} from '../../layout/layout-module';

@NgModule({
  declarations: [ProductsPageComponent, ProductFormComponent],
  imports: [CommonModule, SharedModule, ProductsRoutingModule, LayoutModule],
})
export class ProductsModule {}
