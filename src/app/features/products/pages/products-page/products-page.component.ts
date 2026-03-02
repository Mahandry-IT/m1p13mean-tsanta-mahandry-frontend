import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourceCardsFilterControl } from '../../../../shared/components/resource-cards/resource-cards.component';

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

  productFilters: ResourceCardsFilterControl[] = [
    {
      label: 'Catégorie',
      param: 'categoryId',
      type: 'select',
      options: [],
    },
    {
      label: 'Type',
      param: 'typeId',
      type: 'select',
      options: [],
    },
    {
      label: 'Prix min',
      param: 'minPrice',
      type: 'number',
      placeholder: '0',
    },
    {
      label: 'Prix max',
      param: 'maxPrice',
      type: 'number',
      placeholder: '100000',
    },
  ];

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
