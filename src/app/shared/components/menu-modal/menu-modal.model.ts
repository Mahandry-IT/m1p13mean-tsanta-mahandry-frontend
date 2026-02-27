export interface MenuDto {
  _id: string;
  label: string;
  path: string;
  icon?: string | null;
  order?: number | null;
  parentId?: string | null;
  badge?: string | number | null;
  badgeCount?: number | null;
  badgeText?: string | null;
  [key: string]: unknown;
}

