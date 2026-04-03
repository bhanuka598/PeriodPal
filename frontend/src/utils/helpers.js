export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** False when using offline demo login (`mock-jwt-token-12345`) — API donation routes need a real JWT. */
export function isLiveApiSession() {
  if (typeof localStorage === 'undefined') return false;
  const t = localStorage.getItem('token');
  return Boolean(t && t !== 'mock-jwt-token-12345');
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

export function getInitials(name) {
  if (!name) return 'U';

  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getDaysUntil(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}
/**
 * Turns Axios/fetch errors into a short message for the UI.
 * Network failures (backend not running, wrong URL) get an explicit hint.
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong.') {
  if (!err?.response) {
    if (
      err?.code === 'ERR_NETWORK' ||
      err?.message === 'Network Error' ||
      String(err?.message || '').includes('Network Error')
    ) {
      return 'Cannot reach the API server. Open a terminal in the backend folder and run npm start (or node server.js), then try again. If you use a custom URL, set VITE_API_URL in the frontend .env (e.g. http://localhost:5000/api).';
    }
  }

  const status = err?.response?.status;
  const data = err?.response?.data;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.includes('<!DOCTYPE') || trimmed.includes('<html')) {
      if (status === 404) {
        return 'Donation summary was not found on the API. Restart the backend from the backend folder (npm start), then confirm GET /api/orders/donor-summary exists.';
      }
      return 'The server returned an HTML error page instead of JSON. Check the backend terminal for errors.';
    }
    if (trimmed) return trimmed;
  }

  const msg = data?.message;
  const hint =
    typeof data?.hint === 'string' && data.hint.trim() ? ` ${data.hint.trim()}` : '';
  if (typeof msg === 'string' && msg.trim()) return `${msg.trim()}${hint}`;
  if (Array.isArray(msg) && msg.length) return `${msg.join(', ')}${hint}`;

  return fallback;
}