import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoriesRoutingModule } from './categories-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { LayoutModule } from '../../layout/layout-module';
import { CategoryListComponent } from './pages/category-list/category-list.component';
import { CategoryFormComponent } from './pages/category-form/category-form.component';

@NgModule({
  declarations: [CategoryListComponent, CategoryFormComponent],
  imports: [CommonModule, CategoriesRoutingModule, SharedModule, LayoutModule],
})
export class CategoriesModule {}

