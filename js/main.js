
console.log('[WebGIS] main.js loaded');
const map = L.map('map').setView([-7.81535, 111.98873], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const LAYER_SOURCES = {
  'SLS': 'https://drive.bps.go.id/s/J4zmooj62jtjxrZ/download',
  'PLKUMKM': 'https://drive.bps.go.id/s/5YW2mN8siwLEFsB/download',
  'Matchapro': 'https://drive.bps.go.id/s/LqSFxXeLfFYpbCG/download',
  'SWMAPS': 'https://drive.bps.go.id/s/zAYXQd4dir4RKRA/download',
  'KDM': 'https://drive.bps.go.id/s/TrR9AmXe7z9KciJ/download'
};

const overlayLayers = {};
const layerListEl = document.getElementById('layer-list');
const loadingEl = document.getElementById('loading-indicator');
const layerControlMap = {};

function showLoading(msg) {
  if (loadingEl) { loadingEl.textContent = msg; loadingEl.style.display = 'block'; }
  else console.log('[Loading]', msg);
}
function hideLoading() { if (loadingEl) loadingEl.style.display = 'none'; }

function renderLayerFromText(name, text) {
  try {
    if (text.trim().startsWith('{')) {
      const geo = JSON.parse(text);
      const layer = L.geoJSON(geo, {
        onEachFeature: (f, l) => {
          const props = f.properties || {};
          const info = Object.entries(props).slice(0,5).map(([k,v])=>`<b>${k}</b>: ${v}`).join('<br>');
          l.bindPopup(`<b>${name}</b><br>${info}`);
        }
      });
      overlayLayers[name] = layer;
      layer.addTo(map);
    } else {
      const parsed = Papa.parse(text, { header:true, skipEmptyLines:true });
      const group = L.layerGroup();
      let cnt = 0;
      parsed.data.forEach(r=>{
        const lat = parseFloat(r.Latitude || r.latitude || r.lat);
        const lon = parseFloat(r.Longitude || r.longitude || r.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          L.circleMarker([lat, lon], { radius: 3 }).bindPopup(`<b>${name}</b><br>${r.Nama_Usaha || r.nama_usaha || ''}`).addTo(group);
          cnt++;
        }
      });
      overlayLayers[name] = group;
      group.addTo(map);
      console.log(name + ' rendered (' + cnt + ' points)');
    }
  } catch (err) {
    console.warn('renderLayerFromText error', err);
    alert('Gagal render layer ' + name + ': ' + err.message);
  }
}

async function tryFetchText(url) {
  const res = await fetch(url, { mode:'cors' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  if (res.type === 'opaque') throw new Error('CORS blocked (opaque response)');
  const text = await res.text();
  return text;
}

function createLayerList() {
  Object.keys(LAYER_SOURCES).forEach(name => {
    const div = document.createElement('div');
    div.className = 'layer-item';
    const chk = document.createElement('input');
    chk.type = 'checkbox'; chk.id = 'chk_' + name;
    const lbl = document.createElement('label'); lbl.htmlFor = chk.id; lbl.textContent = name;
    const uploadBtn = document.createElement('button'); uploadBtn.textContent = 'Upload'; uploadBtn.className = 'upload';
    const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept='.geojson,.json,.csv'; fileInput.style.display='none';

    uploadBtn.onclick = ()=> fileInput.click();
    fileInput.onchange = async (e)=>{
      const f = e.target.files[0];
      if (!f) return;
      showLoading('Membaca file upload...');
      const txt = await f.text();
      await saveLayerToIDB(name, txt);
      hideLoading();
      alert('File diupload dan disimpan ke cache. Silakan centang layer untuk memuat.');
    };

    div.appendChild(chk); div.appendChild(lbl); div.appendChild(uploadBtn); div.appendChild(fileInput);
    layerListEl.appendChild(div);
    layerControlMap[name] = chk;

    chk.addEventListener('change', async (ev) => {
      if (ev.target.checked) {
        showLoading('Mengecek cache untuk ' + name + ' ...');
        const cached = await loadLayerFromIDB(name);
        if (cached) {
          hideLoading();
          console.log('📦 ' + name + ' dimuat dari cache');
          renderLayerFromText(name, cached);
        } else {
          showLoading('Mengunduh ' + name + ' dari server...');
          try {
            const text = await tryFetchText(LAYER_SOURCES[name]);
            await saveLayerToIDB(name, text);
            hideLoading();
            console.log('✅ ' + name + ' berhasil diunduh dan disimpan');
            renderLayerFromText(name, text);
          } catch (err) {
            hideLoading();
            console.warn(name + ' fetch error', err);
            alert('Gagal mengunduh ' + name + '. Jika server memblokir CORS, silakan unduh manual dan gunakan tombol Upload.');
            ev.target.checked = false;
          }
        }
      } else {
        if (overlayLayers[name]) {
          map.removeLayer(overlayLayers[name]);
          delete overlayLayers[name];
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  createLayerList();
  const btnClear = document.getElementById('btnClearCache');
  btnClear.addEventListener('click', async ()=>{
    if (!confirm('Hapus semua cache layer?')) return;
    await clearAllLayerCache();
    alert('Cache dihapus.');
  });
  console.log('[WebGIS] Globals initialized');
});
