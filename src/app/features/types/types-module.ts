import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TypesRoutingModule } from './types-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { LayoutModule } from '../../layout/layout-module';
import { TypeListComponent } from './pages/type-list/type-list.component';
import { TypeFormComponent } from './pages/type-form/type-form.component';

@NgModule({
  declarations: [TypeListComponent, TypeFormComponent],
  imports: [CommonModule, TypesRoutingModule, SharedModule, LayoutModule],
})
export class TypesModule {}

