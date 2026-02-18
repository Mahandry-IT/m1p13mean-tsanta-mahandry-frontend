import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule],
  template: `<mat-toolbar color="primary"><button mat-button routerLink="/">Accueil</button></mat-toolbar>`
})
export class NavbarComponent {}

