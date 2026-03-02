// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { StoreListComponent } from './pages/store-list/store-list.component';
// import { StoreDetailComponent } from './pages/store-detail/store-detail.component';
// // import { StoreRequestComponent } from './pages/store-request/store-request.component';

// const routes: Routes = [
//   { path: '', component: StoreListComponent, data: { standalone: true } },
//   // { path: 'request', component: StoreRequestComponent },
//   { path: ':id', component: StoreDetailComponent }
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule]
// })
// export class StoresRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreListComponent } from './pages/store-list/store-list.component';
import { StoreCreateComponent } from './pages/store-create/store-create.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: StoreListComponent },
  { path: 'create', component: StoreCreateComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoresRoutingModule { }