import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSig = signal<string | null>(null);
  isAuthenticated(){ return !!this.tokenSig(); }
  getToken(){ return this.tokenSig(); }
  login(token:string){ this.tokenSig.set(token); }
  logout(){ this.tokenSig.set(null); }
}

