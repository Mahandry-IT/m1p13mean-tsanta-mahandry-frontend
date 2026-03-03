import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { RegisterManagerComponent } from './pages/register-manager/register-manager.component';
import { ActivateComponent } from './pages/activate/activate.component';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { LoginAdminComponent } from './pages/login-admin/login-admin.component';
import { LoginCustomerComponent } from './pages/login-customer/login-customer.component';
import { LoginManagerComponent } from './pages/login-manager/login-manager.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'register-manager', component: RegisterManagerComponent },
  { path: 'activate', component: ActivateComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'new-password', component: NewPasswordComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'login-admin', component: LoginAdminComponent },
  { path: 'login-customer', component: LoginCustomerComponent },
  { path: 'login-manager', component: LoginManagerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
