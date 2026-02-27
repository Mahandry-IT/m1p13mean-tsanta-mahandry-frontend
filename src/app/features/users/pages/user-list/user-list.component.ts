import { Component } from '@angular/core';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false,
})
export class UserListComponent {
  columns = [
    { key: 'username', header: 'Nom' },
    { key: 'email', header: 'Email' }
  ];

  onEdit(row: any): void {
    // TODO: navigation vers form
    console.log('edit', row);
  }

  onDelete(row: any): void {
    // TODO: ouvrir confirm dialog
    console.log('delete', row);
  }

  onInfo(row: any): void {
    console.log('info', row);
  }
}
