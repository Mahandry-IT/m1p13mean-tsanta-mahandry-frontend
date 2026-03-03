import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing-module';
import { SharedModule } from '../../shared/shared-module';

import { CreateProfileComponent } from './pages/create/create.component';
import { CheckComponent } from './pages/check/check.component';
import { EditProfileComponent } from './pages/edit/edit.component';

@NgModule({
  declarations: [CreateProfileComponent, CheckComponent, EditProfileComponent],
  imports: [CommonModule, SharedModule, ProfileRoutingModule],
})
export class ProfileModule {}
