import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProductsPageComponent {
  // endpoint backend: /api/products
  endpoint = '/products';

  onInfo(row: any) {
    console.log('info product', row);
  }

  onEdit(row: any) {
    console.log('edit product', row);
  }

  onDelete(row: any) {
    console.log('delete product', row);
  }
}
