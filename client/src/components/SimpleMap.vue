<template>
  <div class="map-wrapper">
    <div :id="mapId" class="map-container"></div>
    <div class="map-hint">
      <small>💡 Gunakan tombol + / - untuk zoom, klik titik merah untuk detail.</small>
    </div>
  </div>
</template>

<script setup>
import { onMounted, defineProps } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  lat: String,
  lon: String,
  index: Number,
  magnitude: String,
  depth: String,
  wilayah: String
});

const mapId = `map-${props.index}`;

const parseCoordinate = (latStr, lonStr) => {
  let lat = parseFloat(latStr);
  let lon = parseFloat(lonStr);
  if (latStr.includes('LS')) lat = -Math.abs(lat);
  if (lonStr.includes('BB')) lon = -Math.abs(lon);
  return [lat, lon];
};

onMounted(() => {
  const [latitude, longitude] = parseCoordinate(props.lat, props.lon);

  // 1. Setup Peta
  const map = L.map(mapId, {
    center: [latitude, longitude],
    zoom: 7, 
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: false // Matikan scroll mouse biar tidak mengganggu
  });

  // 2. Layer Peta (ESRI - Laut Biru, Daratan Bersih)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  }).addTo(map);

  // 3. Style Pin Merah (Berdenyut)
  const redIcon = L.divIcon({
    className: 'custom-pin',
    html: '<div style="background-color: #e74c3c; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4); animation: pulse-ring 2s infinite;"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });

  // 4. Marker & Popup Data Lengkap
  const marker = L.marker([latitude, longitude], { icon: redIcon }).addTo(map);

  const popupContent = `
    <div style="font-family: sans-serif; text-align: center; min-width: 150px;">
      <h3 style="margin:0; color: #e74c3c; font-size: 1.2em;">${props.magnitude} SR</h3>
      <p style="margin: 5px 0; font-size: 0.9em; font-weight: bold;">${props.wilayah}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;">
      <p style="margin: 0; font-size: 0.8em; color: #666;">
        Kedalaman: <strong>${props.depth}</strong><br>
        Lokasi: ${latitude}, ${longitude}
      </p>
    </div>
  `;

  marker.bindPopup(popupContent);
  
  // Perbaikan bug tampilan peta jika dimuat dalam tab tersembunyi
  setTimeout(() => { map.invalidateSize(); }, 100);
});
</script>

<style scoped>
/* Wrapper Utama */
.map-wrapper {
  position: relative;
  margin-top: 20px;
  width: 100%; /* Pastikan wrapper mengambil lebar penuh */
}

/* Kontainer Peta */
.map-container {
  width: 100%;          /* Lebar 100% mengikuti induknya */
  height: 300px;        /* Tinggi diperbesar sedikit agar proporsional */
  background: #aadaff;  /* Background biru muda (fallback) */
  border-radius: 8px;
  z-index: 1;
  border: 1px solid #ddd;
  box-sizing: border-box; /* Agar border tidak menambah lebar total */
}

.map-hint { 
  font-size: 0.75rem; color: #888; margin-top: 8px; text-align: center; font-style: italic;
}

/* Animasi Pin CSS */
:deep(.custom-pin div) { position: relative; }
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
  100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
}

/* Responsif untuk HP */
@media (max-width: 480px) {
  .map-container {
    height: 250px; /* Sedikit lebih pendek di HP */
  }
}
</style>