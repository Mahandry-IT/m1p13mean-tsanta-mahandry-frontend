import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [MatTableModule],
  template: `
    <table mat-table [dataSource]="data" class="mat-elevation-z1">
      <!-- Colonne: name -->
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef> Nom </th>
        <td mat-cell *matCellDef="let user"> {{ user.name }} </td>
      </ng-container>

      <!-- Colonne: email -->
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef> Email </th>
        <td mat-cell *matCellDef="let user"> {{ user.email }} </td>
      </ng-container>

      <!-- Header & Rows -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
})
export class UserListComponent {
  displayedColumns = ['name', 'email'];
  data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
  ];
}
