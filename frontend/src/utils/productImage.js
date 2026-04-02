const PLACEHOLDER_SMALL =
  'https://placehold.co/96x96/fce7f3/831843?text=PP';
const PLACEHOLDER_LARGE =
  'https://placehold.co/600x450/fce7f3/831843?text=PeriodPal';

/**
 * Product.imageUrl may be a remote URL or a path like /uploads/products/xyz.jpg
 * served from the API origin (not /api).
 */
export function resolveProductImageUrl(imageUrl, variant = 'small') {
  const ph = variant === 'large' ? PLACEHOLDER_LARGE : PLACEHOLDER_SMALL;
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return ph;
  }
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const apiBase =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/i, '') || 'http://localhost:5000';
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${path}`;
}
