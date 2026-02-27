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
  parentId?: string | null;
}

export interface MenuModalData {
  title?: string;
  items : MenuModalItem[];
}

interface MenuTreeNode extends MenuModalItem {
  children: MenuTreeNode[];
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
  private readonly expanded = new Set<string>();

  constructor(
      private readonly dialogRef : MatDialogRef<MenuModalComponent, string | null>,
      private readonly router    : Router,
      @Inject(MAT_DIALOG_DATA) public readonly data: MenuModalData,
  ) {}

  close(): void {
    this.dialogRef.close(null);
  }

  async onMenuClick(item: MenuModalItem): Promise<void> {
    this.dialogRef.close(item.path);
    await this.router.navigateByUrl(item.path);
  }

  get sortedItems(): MenuModalItem[] {
    const items = this.data.items ?? [];
    return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  toggle(item: MenuTreeNode): void {
    if (!this.hasChildren(item)) return;
    if (this.expanded.has(item.id)) this.expanded.delete(item.id);
    else this.expanded.add(item.id);
  }

  isExpanded(item: MenuTreeNode): boolean {
    return this.expanded.has(item.id);
  }

  hasChildren(item: MenuTreeNode): boolean {
    return (item.children?.length ?? 0) > 0;
  }

  /** Clic sur une ligne: si parent => toggle ; si feuille => navigation */
  async onNodeClick(item: MenuTreeNode): Promise<void> {
    if (this.hasChildren(item)) {
      this.toggle(item);
      return;
    }
    await this.onMenuClick(item);
  }

  trackByNodeId(_: number, item: MenuTreeNode): string {
    return item.id;
  }

  get tree(): MenuTreeNode[] {
    return this.buildTree(this.sortedItems);
  }

  private buildTree(items: MenuModalItem[]): MenuTreeNode[] {
    const byId = new Map<string, MenuTreeNode>();
    const byPath = new Map<string, MenuTreeNode>();
    const roots: MenuTreeNode[] = [];

    // init
    for (const it of items) {
      const node: MenuTreeNode = { ...it, children: [] };
      byId.set(it.id, node);
      if (it.path) byPath.set(it.path, node);
    }

    const normalizeParentKey = (v: unknown): string => {
      if (!v) return '';
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'object') {
        const anyV = v as any;
        // cas: parentId: { _id: '...', path: '/..' }
        const id = typeof anyV._id === 'string' ? anyV._id.trim() : '';
        if (id) return id;
        const path = typeof anyV.path === 'string' ? anyV.path.trim() : '';
        if (path) return path;
      }
      return '';
    };

    // link
    for (const node of byId.values()) {
      const parentKey = normalizeParentKey((node as any).parentId);
      if (!parentKey) {
        roots.push(node);
        continue;
      }

      // parentKey peut être un _id ou un path
      const parent = byId.get(parentKey) ?? byPath.get(parentKey);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }

    const sortRec = (nodes: MenuTreeNode[]) => {
      nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const n of nodes) sortRec(n.children);
    };
    sortRec(roots);

    return roots;
  }
}
