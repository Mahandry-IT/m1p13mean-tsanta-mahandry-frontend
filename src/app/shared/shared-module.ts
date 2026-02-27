import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material/material-module';
import { InputComponent } from './components/input/input.component';
import { ButtonComponent } from './components/button/button.component';
import { PageComponent } from './components/page/page.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [InputComponent, ButtonComponent, PageComponent, NavbarComponent, FooterComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, NgxIntlTelInputModule],
  exports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIntlTelInputModule,
    InputComponent,
    ButtonComponent,
    PageComponent,
    NavbarComponent,
    FooterComponent
  ],
})
export class SharedModule {}
