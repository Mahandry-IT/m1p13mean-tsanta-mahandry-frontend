import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing-module';
import { UserListComponent } from './pages/user-list/user-list.component';
import { SharedModule } from '../../shared/shared-module';
import {LayoutModule} from '../../layout/layout-module';

@NgModule({
  declarations: [UserListComponent],
  imports: [
    CommonModule,
    UsersRoutingModule,
    SharedModule,
    LayoutModule,
  ]
})
export class UsersModule { }
