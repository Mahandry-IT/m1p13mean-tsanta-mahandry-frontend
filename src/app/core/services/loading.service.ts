import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  start() {
    this.pending++;
    if (this.pending === 1) this._loading$.next(true);
  }

  stop() {
    if (this.pending > 0) this.pending--;
    if (this.pending === 0) this._loading$.next(false);
  }
}

