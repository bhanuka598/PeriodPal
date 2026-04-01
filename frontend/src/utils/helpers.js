export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
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

  const data = err?.response?.data;
  const msg = data?.message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length) return msg.join(', ');
  if (typeof data === 'string' && data.trim()) return data;

  return fallback;
}