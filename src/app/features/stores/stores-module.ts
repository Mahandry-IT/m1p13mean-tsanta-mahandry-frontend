import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 

import { StoresRoutingModule } from './stores-routing-module';
import { StoreListComponent } from './pages/store-list/store-list.component';
import { StoreFormComponent } from './pages/store-form/store-form.component';
import { StoreCreateComponent } from './pages/store-create/store-create.component';
import { SharedModule } from '../../shared/shared-module';
import { LayoutModule } from '../../layout/layout-module';

@NgModule({
  declarations: [
    StoreListComponent,
    StoreFormComponent,
    StoreCreateComponent
  ],  
  imports: [
    CommonModule,
    FormsModule,
    StoresRoutingModule,
    SharedModule,
    LayoutModule,
  ],
})
export class StoresModule { }