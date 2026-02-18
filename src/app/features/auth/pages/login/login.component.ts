import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `<form [formGroup]="form" (ngSubmit)="submit()" style="max-width:360px;margin:24px auto;display:flex;flex-direction:column;gap:12px">
  <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email"></mat-form-field>
  <mat-form-field appearance="outline"><mat-label>Mot de passe</mat-label><input matInput type="password" formControlName="password"></mat-form-field>
  <button mat-raised-button color="primary">Se connecter</button>
</form>`
})
export class LoginComponent {
  form!: FormGroup;
  constructor(private fb: FormBuilder){
    this.form = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }
  submit(){}
}
