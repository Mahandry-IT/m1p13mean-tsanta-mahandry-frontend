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
      remoteOptions: {
        endpoint: '/categories',
        itemsKey: 'items',
        valueField: '_id',
        labelField: 'name',
        params: { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' },
      },
    },
    {
      label: 'Type',
      param: 'typeId',
      type: 'select',
      remoteOptions: {
        endpoint: '/types',
        itemsKey: 'items',
        valueField: '_id',
        labelField: 'name',
        dependsOn: ['categoryId'],
        params: { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' },
      },
    }
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
