import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { MenuModalComponent, MenuModalData, MenuModalItem } from './menu-modal.component';

@Injectable({
  providedIn: 'root',
})
export class MenuModalService {
  constructor(private readonly dialog: MatDialog) {}

  open(data: MenuModalData): Observable<string | null> {
    const ref = this.dialog.open<MenuModalComponent, MenuModalData, string | null>(MenuModalComponent, {
      data,
      disableClose  : false,
      autoFocus     : false,
      width         : '260px',
      maxWidth      : '80vw',
      height        : 'calc(100vh - 32px)',
      maxHeight     : 'calc(100vh - 32px)',
      panelClass    : 'menu-modal-panel',
      position      : { top: '16px', left: '16px' },  // flotte avec marge
    });

    return ref.afterClosed().pipe(map((v) => v ?? null));
  }

  openWithItems(items: MenuModalItem[], title = 'Menu'): Observable<string | null> {
    return this.open({ title, items });
  }
}
