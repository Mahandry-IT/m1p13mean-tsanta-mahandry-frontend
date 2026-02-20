import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material/material-module';
import { InputComponent } from './components/input/input.component';
import { ButtonComponent } from './components/button/button.component';
import { PageComponent } from './components/page/page.component';

@NgModule({
  declarations: [InputComponent, ButtonComponent, PageComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule],
  exports: [MaterialModule, InputComponent, ButtonComponent, PageComponent],
})
export class SharedModule {}
