const KEY = 'periodpal_guest_id';

export function getGuestId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
