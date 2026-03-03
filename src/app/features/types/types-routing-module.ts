import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TypeListComponent } from './pages/type-list/type-list.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: TypeListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TypesRoutingModule {}

