// File-API client + shared token-form helpers.

export const api = {
  config: () => fetch('/api/config').then((r) => r.json()),
  list: () => fetch('/api/tokens').then((r) => r.json()),
  read: (name) => fetch(`/api/tokens/${encodeURIComponent(name)}`).then((r) => r.json()),
  write: (name, content) =>
    fetch(`/api/tokens/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).then((r) => r.json()),
  del: (name) => fetch(`/api/tokens/${encodeURIComponent(name)}`, { method: 'DELETE' }).then((r) => r.json()),
  saveOrder: (order) =>
    fetch('/api/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    }).then((r) => r.json()),
};

export const TOKEN_TYPES = ['color', 'number', 'dimension', 'fontWeight', 'fontFamily', 'string', 'boolean'];

// Coerce a text value from the token form into the right JS type for its $type.
export function coerceNewValue(type, text) {
  const t = text.trim();
  if (type === 'number' || type === 'fontWeight' || type === 'dimension') return isNaN(Number(t)) ? t : Number(t);
  if (type === 'boolean') return t === 'true';
  if (type === 'fontFamily') return t.includes(',') ? t.split(',').map((s) => s.trim()) : [t];
  return t; // color (hex), string, etc.
}
