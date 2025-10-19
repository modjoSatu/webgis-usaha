
const DB_NAME = 'webgis_v8_db';
const DB_VERSION = 1;
const STORE_LAYERS = 'layers';
async function openDb() {
  if (!window.idb) {
    console.warn('idb library not found, falling back to simple storage');
    return null;
  }
  const db = await idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_LAYERS)) {
        db.createObjectStore(STORE_LAYERS);
      }
    }
  });
  return db;
}
async function saveLayerToIDB(key, text) {
  const db = await openDb();
  if (!db) {
    localStorage.setItem('cache_' + key, text);
    return true;
  }
  await db.put(STORE_LAYERS, text, key);
  return true;
}
async function loadLayerFromIDB(key) {
  const db = await openDb();
  if (!db) {
    return localStorage.getItem('cache_' + key);
  }
  const res = await db.get(STORE_LAYERS, key);
  return res;
}
async function clearAllLayerCache() {
  const db = await openDb();
  if (!db) {
    Object.keys(localStorage).forEach(k => { if (k.startsWith('cache_')) localStorage.removeItem(k); });
    return;
  }
  const tx = db.transaction(STORE_LAYERS, 'readwrite');
  const store = tx.objectStore(STORE_LAYERS);
  const keys = await store.getAllKeys();
  for (const k of keys) { await store.delete(k); }
  await tx.done;
}
