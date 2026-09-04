const KEY = 'bq_campus_context';

export function setCampusContext(campusId) {
  try {
    sessionStorage.setItem(KEY, campusId);
  } catch {}
}

export function consumeCampusContext() {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value || null;
  } catch {
    return null;
  }
}