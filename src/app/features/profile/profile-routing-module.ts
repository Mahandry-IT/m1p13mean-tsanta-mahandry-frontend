import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CheckComponent } from './pages/check/check.component';
import { CreateProfileComponent } from './pages/create/create.component';

const routes: Routes = [
  { path: 'check', component: CheckComponent },
  { path: 'create', component: CreateProfileComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileRoutingModule {}

