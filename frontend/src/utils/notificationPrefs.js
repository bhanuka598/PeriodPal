const keyFor = (userId) => `periodpal:notif:${userId || 'guest'}`;

const defaultPrefs = () => ({
  lastSeenPaymentsAt: null,
  lastSeenCatalogAt: null,
  inbox: []
});

export function getNotificationPrefs(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return defaultPrefs();
    const p = JSON.parse(raw);
    return {
      ...defaultPrefs(),
      ...p,
      inbox: Array.isArray(p.inbox) ? p.inbox : []
    };
  } catch {
    return defaultPrefs();
  }
}

function save(userId, prefs) {
  localStorage.setItem(keyFor(userId), JSON.stringify(prefs));
}

export function markPaymentsSeen(userId, latestPaidIso) {
  if (!userId || !latestPaidIso) return;
  const p = getNotificationPrefs(userId);
  const t = Date.parse(latestPaidIso);
  if (Number.isNaN(t)) return;
  const prev = p.lastSeenPaymentsAt ? Date.parse(p.lastSeenPaymentsAt) : 0;
  const nextIso = new Date(Math.max(prev, t)).toISOString();
  save(userId, { ...p, lastSeenPaymentsAt: nextIso });
}

export function markCatalogSeen(userId) {
  if (!userId) return;
  const p = getNotificationPrefs(userId);
  save(userId, { ...p, lastSeenCatalogAt: new Date().toISOString() });
}

export function markCatalogSeenWithLatestProduct(userId, products) {
  if (!userId || !Array.isArray(products) || products.length === 0) {
    markCatalogSeen(userId);
    return;
  }
  let maxMs = 0;
  for (const pr of products) {
    const raw = pr.updatedAt || pr.createdAt;
    if (!raw) continue;
    const ms = Date.parse(raw);
    if (!Number.isNaN(ms)) maxMs = Math.max(maxMs, ms);
  }
  const p = getNotificationPrefs(userId);
  const nowMs = Date.now();
  const iso = new Date(Math.max(maxMs, nowMs)).toISOString();
  save(userId, { ...p, lastSeenCatalogAt: iso });
}

export function pushInboxMessage(userId, { title, link } = {}) {
  if (!userId || !title) return;
  const p = getNotificationPrefs(userId);
  const inbox = [...(p.inbox || [])];
  const t = String(title);
  const last = inbox[0];
  if (last && last.title === t) {
    const delta = Date.now() - Date.parse(last.at);
    if (!Number.isNaN(delta) && delta < 4000) return;
  }
  inbox.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: t,
    at: new Date().toISOString(),
    read: false,
    link: link ? String(link) : ''
  });
  save(userId, { ...p, inbox: inbox.slice(0, 50) });
}

export function markAllInboxRead(userId) {
  if (!userId) return;
  const p = getNotificationPrefs(userId);
  const inbox = (p.inbox || []).map((m) => ({ ...m, read: true }));
  save(userId, { ...p, inbox });
}

export function markInboxItemRead(userId, id) {
  if (!userId || !id) return;
  const p = getNotificationPrefs(userId);
  const inbox = (p.inbox || []).map((m) =>
    m.id === id ? { ...m, read: true } : m
  );
  save(userId, { ...p, inbox });
}

export function clearPaymentSessionHint() {
  try {
    sessionStorage.removeItem('periodpal:paymentJustPaid');
  } catch {
    /* ignore */
  }
}

export function setPaymentSessionHint() {
  try {
    sessionStorage.setItem('periodpal:paymentJustPaid', '1');
  } catch {
    /* ignore */
  }
}

export function hasPaymentSessionHint() {
  try {
    return sessionStorage.getItem('periodpal:paymentJustPaid') === '1';
  } catch {
    return false;
  }
}
