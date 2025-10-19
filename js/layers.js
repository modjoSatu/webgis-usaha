/* layers.js - auto loader for layers using fetchWithCache (utils.js) */
async function loadSLSFromURL() {
  const key = 'sls_geojson_v1';
  showLoading('Memuat SLS dari server...');
  try {
    const text = await fetchWithCache('https://drive.bps.go.id/s/J4zmooj62jtjxrZ/download', key);
    if (!text) throw new Error('Gagal ambil SLS dan tidak ada cache.');
    const json = JSON.parse(text);
    slsLayer.clearLayers();
    slsLayer.addData(json);
    if (slsLayer.getLayers().length > 0) {
      safeFitBounds(slsLayer);
      slsSnapshot = slsLayer.getLayers().slice();
      const kec = new Set();
      slsSnapshot.forEach(layer => {
        const p = layer.feature?.properties || {};
        const nm = getPropIgnoreCase(p, ['nmkec','Nama_Kec','kecamatan']) || '';
        if (nm) kec.add(nm);
      });
      fillSelectFromSet('filterKec', kec, '--Pilih Kecamatan--');
      fillSelectFromSet('filterDesa', new Set(), '--Pilih Desa--');
      fillSelectFromSet('filterSLS', new Set(), '--Pilih SLS--');
    }
    showTempToast('Layer SLS berhasil dimuat (auto).');
  } catch (err) {
    console.warn('loadSLSFromURL error', err);
    alert('Gagal memuat SLS otomatis: ' + err.message);
    document.getElementById('fileSLS').style.display = 'block';
  } finally {
    hideLoading();
  }
}

async function loadPLKFromURL() {
  const key = 'plk_geojson_v1';
  showLoading('Memuat PLKUMKM dari server...');
  try {
    const text = await fetchWithCache('https://drive.bps.go.id/s/5YW2mN8siwLEFsB/download', key);
    if (!text) throw new Error('Gagal ambil PLKUMKM dan tidak ada cache.');
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const json = JSON.parse(text);
      plkLayer.clearLayers(); plkLayer.addData(json); safeFitBounds(plkLayer);
    } else {
      const parsed = Papa.parse(text, { header:true, skipEmptyLines:true });
      const geo = csvRowsToGeoJSON(parsed.data);
      plkLayer.clearLayers(); plkLayer.addData(geo); safeFitBounds(plkLayer);
    }
    showTempToast('Layer PLKUMKM berhasil dimuat (auto).');
  } catch (err) {
    console.warn('loadPLKFromURL error', err);
    alert('Gagal memuat PLKUMKM otomatis: ' + err.message);
    document.getElementById('filePLKUKM').style.display = 'block';
  } finally { hideLoading(); }
}

async function loadMatchaproFromURL() {
  const key = 'matchapro_csv_v1';
  showLoading('Memuat Matchapro dari server...');
  try {
    const text = await fetchWithCache('https://drive.bps.go.id/s/LqSFxXeLfFYpbCG/download', key);
    if (!text) throw new Error('Gagal ambil Matchapro dan tidak ada cache.');
    const parsed = Papa.parse(text, { header:true, skipEmptyLines:true }).data;
    const geo = csvToGeoJSON_Matchapro(parsed);
    matchaproLayer.clearLayers(); matchaproLayer.addData(geo); safeFitBounds(matchaproLayer); refreshPoolMarkers();
    showTempToast('Layer Matchapro berhasil dimuat (auto).');
  } catch (err) {
    console.warn('loadMatchaproFromURL error', err);
    alert('Gagal memuat Matchapro otomatis: ' + err.message);
    document.getElementById('fileMATCHAPRO').style.display = 'block';
  } finally { hideLoading(); }
}

async function loadSWMAPSFromURL() {
  const key = 'swmaps_csv_v1';
  showLoading('Memuat SWMAPS dari server...');
  try {
    const text = await fetchWithCache('https://drive.bps.go.id/s/zAYXQd4dir4RKRA/download', key);
    if (!text) throw new Error('Gagal ambil SWMAPS dan tidak ada cache.');
    const parsed = Papa.parse(text, { header:true, skipEmptyLines:true }).data;
    const geo = csvRowsToGeoJSON(parsed);
    swmapsLayer.clearLayers(); swmapsLayer.addData(geo); safeFitBounds(swmapsLayer); refreshPoolMarkers();
    showTempToast('Layer SWMAPS berhasil dimuat (auto).');
  } catch (err) {
    console.warn('loadSWMAPSFromURL error', err);
    alert('Gagal memuat SWMAPS otomatis: ' + err.message);
    document.getElementById('fileSWMAPS').style.display = 'block';
  } finally { hideLoading(); }
}

async function loadKDMFromURL() {
  const key = 'kdm_csv_latest';
  showLoading('Memuat KDM dari server...');
  try {
    const text = await fetchWithCache('https://drive.bps.go.id/s/TrR9AmXe7z9KciJ/download', key);
    if (!text) throw new Error('Gagal ambil KDM dan tidak ada cache.');
    const parsed = Papa.parse(text, { header:true, skipEmptyLines:true }).data;
    const geo = csvRowsToGeoJSON(parsed);
    kdmLayer.clearLayers(); kdmLayer.addData(geo); safeFitBounds(kdmLayer); refreshPoolMarkers();
    showTempToast('Layer KDM berhasil dimuat (auto).');
  } catch (err) {
    console.warn('loadKDMFromURL error', err);
    alert('Gagal memuat KDM otomatis: ' + err.message);
    document.getElementById('fileKDM').style.display = 'block';
  } finally { hideLoading(); }
}

async function autoLoadAll() {
  try { await loadSLSFromURL(); } catch(e){ console.warn(e); }
  loadPLKFromURL();
  loadSWMAPSFromURL();
  loadMatchaproFromURL();
  loadKDMFromURL();
}
