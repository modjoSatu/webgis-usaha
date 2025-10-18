/* utils.js - small IndexedDB wrapper and fetchWithCache */
function openIdb(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbPut(dbName, storeName, key, value) {
  const db = await openIdb(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => { resolve(true); db.close(); };
    req.onerror = (e) => { reject(e.target.error); db.close(); };
  });
}

async function idbGet(dbName, storeName, key) {
  const db = await openIdb(dbName, storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = (e) => { resolve(e.target.result); db.close(); };
    req.onerror = (e) => { reject(e.target.error); db.close(); };
  });
}

/**
 * fetchWithCache(url, key, options)
 * - attempts network fetch; on success stores text response in IndexedDB under key
 * - on network failure returns cached value (string) or null
 */
async function fetchWithCache(url, key, options={}) {
  const DB = 'webgis-cache';
  const STORE = 'layers';
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('Network response not ok: ' + res.status);
    const text = await res.text();
    try { await idbPut(DB, STORE, key, { data: text, ts: Date.now(), url }); } catch(e){}
    return text;
  } catch (e) {
    // fallback to cached
    try {
      const cached = await idbGet(DB, STORE, key);
      return cached ? cached.data : null;
    } catch(err) {
      return null;
    }
  }
}
