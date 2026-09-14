const clients = new Map();

export function addNotificationClient(userId, res) {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
  res.on("close", () => {
    const set = clients.get(key);
    if (!set) return;
    set.delete(res);
    if (!set.size) clients.delete(key);
  });
}

export function emitToUser(userId, event, payload) {
  const set = clients.get(String(userId));
  if (!set) return;
  const body = JSON.stringify(payload);
  for (const res of set) {
    try {
      res.write(`event: ${event}\ndata: ${body}\n\n`);
    } catch {
      set.delete(res);
    }
  }
}
