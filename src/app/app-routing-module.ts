import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home-module').then(m => m.HomeModule) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule) },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard-module').then(m => m.DashboardModule) },
  {
    path: 'admin/dashboard',
    loadChildren: () =>
      import('./features/dashboard/admin/admin-dashboard-module').then(
        (m) => m.AdminDashboardModule,
      ),
  },
  { path: 'profile', loadChildren: () => import('./features/profile/profile-module').then(m => m.ProfileModule) },
  { path: 'users', loadChildren: () => import('./features/users/users-module').then(m => m.UsersModule) },
  { path: 'admin/stores', loadChildren: () => import('./features/stores/stores-module').then(m => m.StoresModule) },
  { path: 'manager/stores', loadChildren: () => import('./features/stores/stores-module').then(m => m.StoresModule) },
  { path: 'products', loadChildren: () => import('./features/products/products-module').then(m => m.ProductsModule) },
  { path: 'categories', loadChildren: () => import('./features/categories/categories-module').then(m => m.CategoriesModule) },
  { path: 'types', loadChildren: () => import('./features/types/types-module').then(m => m.TypesModule) },
  { path: 'my-product', loadChildren: () => import('./features/my-product/my-product-module').then(m => m.MyProductModule) },
  { path: 'buy-product', loadChildren: () => import('./features/buy-product/buy-product-module').then(m => m.BuyProductModule) },
  { path: 'promotions', loadChildren: () => import('./features/promotions/promotions-module').then(m => m.PromotionsModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
