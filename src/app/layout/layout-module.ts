import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared-module';
import { AppShellComponent } from './app-shell/app-shell.component';



@NgModule({
  declarations: [AppShellComponent],
  imports: [CommonModule, SharedModule],
  exports: [AppShellComponent],
})
export class LayoutModule { }
