import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing-module';
import { SharedModule } from '../../shared/shared-module';

import { CreateProfileComponent } from './pages/create/create.component';
import { CheckComponent } from './pages/check/check.component';

@NgModule({
  declarations: [CreateProfileComponent, CheckComponent],
  imports: [CommonModule, SharedModule, ProfileRoutingModule],
})
export class ProfileModule {}

