import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutModule } from '../../layout/layout-module';
import { SharedModule } from '../../shared/shared-module';
import { MyProductRoutingModule } from './my-product-routing-module';
import { MyProductsPageComponent } from './pages/my-products-page/my-products-page.component';
import { MyProductsFormComponent } from './pages/my-products-form/my-products-form.component';
import { MyProductsAddDialogComponent } from './pages/my-products-add-dialog/my-products-add-dialog.component';

@NgModule({
  declarations: [MyProductsPageComponent, MyProductsFormComponent, MyProductsAddDialogComponent],
  imports: [CommonModule, SharedModule, LayoutModule, MyProductRoutingModule],
})
export class MyProductModule {}
