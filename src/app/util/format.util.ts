export function formatDateTime(value: unknown, locale = 'fr-FR'): string {
  if (value === null || value === undefined || value === '') return '';

  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return '';

  // date + heure (courte) au format FR
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatThousands(value: unknown, locale = 'fr-FR'): string {
  if (value === null || value === undefined || value === '') return '';

  // Support Decimal128 mongoose sérialisé
  if (typeof value === 'object' && value && '$numberDecimal' in (value as any)) {
    return formatThousands((value as any).$numberDecimal, locale);
  }

  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n)) return '';

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 20,
  }).format(n);
}

