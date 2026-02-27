import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

export interface MenuModalItem {
  id     : string;
  label  : string;
  path   : string;
  icon  ?: string | null;
  badge ?: string | number | null;
  order ?: number | null;
}

export interface MenuModalData {
  title?: string;
  items : MenuModalItem[];
}

@Component({
  selector        : 'app-menu-modal',
  standalone      : true,
  imports         : [
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatBadgeModule,
    MatIconModule,
    RouterModule,
  ],
  templateUrl     : './menu-modal.component.html',
  styleUrls       : ['./menu-modal.component.scss'],
  changeDetection : ChangeDetectionStrategy.OnPush,
})
export class MenuModalComponent {
  constructor(
      private readonly dialogRef : MatDialogRef<MenuModalComponent, string | null>,
      private readonly router    : Router,
      @Inject(MAT_DIALOG_DATA) public readonly data: MenuModalData,
  ) {}

  close(): void {
    this.dialogRef.close(null);
  }

  trackById(_: number, item: MenuModalItem): string {
    return item.id;
  }

  async onMenuClick(item: MenuModalItem): Promise<void> {
    this.dialogRef.close(item.path);
    await this.router.navigateByUrl(item.path);
  }

  get sortedItems(): MenuModalItem[] {
    const items = this.data.items ?? [];
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}
