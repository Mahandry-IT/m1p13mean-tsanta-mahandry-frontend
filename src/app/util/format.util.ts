import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

/**
 * Convertit un numéro E.164 (ex: +261330866369) en format national (sans indicatif) via libphonenumber-js.
 *
 * @param value Numéro (E.164 conseillé)
 * @param defaultCountry Pays par défaut si le numéro n'a pas de "+" (ex: 'MG', 'FR')
 */
export function toNationalPhone(value: unknown, defaultCountry: string = 'MG'): string {
  if (value === null || value === undefined || value === '') return '';

  const raw = String(value).trim();
  if (!raw) return '';

  try {
    const phone = parsePhoneNumberFromString(raw, defaultCountry as any);
    if (phone) return phone.nationalNumber;
  } catch {
    // ignore et fallback
  }

  // Fallback conservateur: si E.164, on enlève juste le +<dialCode>
  const compact = raw.replace(/[\s\-()]/g, '');
  if (!compact.startsWith('+')) return raw;
  const m = compact.match(/^\+(\d{1,3})(\d+)$/);
  if (!m) return raw;
  return m[2] ?? '';
}
