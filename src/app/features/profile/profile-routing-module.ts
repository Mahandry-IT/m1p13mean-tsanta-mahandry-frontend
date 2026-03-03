import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CheckComponent } from './pages/check/check.component';
import { CreateProfileComponent } from './pages/create/create.component';
import { EditProfileComponent } from './pages/edit/edit.component';

const routes: Routes = [
  { path: 'check', component: CheckComponent },
  { path: 'create', component: CreateProfileComponent },
  { path: 'edit', component: EditProfileComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileRoutingModule {}

