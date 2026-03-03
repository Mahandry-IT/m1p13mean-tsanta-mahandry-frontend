import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing-module';
import { SharedModule } from '../../shared/shared-module';
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

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    RegisterManagerComponent,
    ActivateComponent,
    LogoutComponent,
    NewPasswordComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    LoginAdminComponent,
    LoginCustomerComponent,
    LoginManagerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
