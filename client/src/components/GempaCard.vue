<template>
  <div class="dashboard">
    
    <div class="filter-section">
      <label>🌍 Pilih Daerah Pantauan:</label>
      <select v-model="selectedProvinsi" class="prov-select">
        <option value="">Semua Indonesia (Nasional)</option>
        
        <option value="BENGKULU">Bengkulu (Termasuk Enggano)</option>
        <option value="JABAR">Jawa Barat</option>
        <option value="JATENG">Jawa Tengah</option>
        <option value="JATIM">Jawa Timur</option>
        <option value="DIY">DI Yogyakarta</option>
        <option value="BANTEN">Banten</option>
        <option value="BALI">Bali</option>
        <option value="SUMUT">Sumatera Utara</option>
        <option value="SUMBAR">Sumatera Barat</option>
        <option value="LAMPUNG">Lampung</option>
        <option value="NTB">Nusa Tenggara Barat</option>
        <option value="NTT">Nusa Tenggara Timur</option>
        <option value="SULUT">Sulawesi Utara</option>
        <option value="MALUKU">Maluku</option>
        <option value="PAPUA">Papua</option>
      </select>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Sedang memuat data terbaru dari BMKG...</p>
    </div>
    <div v-else-if="error" class="error">⚠️ {{ error }}</div>

    <div v-else class="list-container">
      
      <div v-if="filteredGempa.length === 0" class="empty-state">
        <h3>Aman Terkendali</h3>
        <p>Tidak ada gempa signifikan di wilayah <strong>{{ selectedProvinsi || 'Indonesia' }}</strong> dalam 15 data terakhir.</p>
      </div>

      <div v-for="(gempa, index) in filteredGempa" :key="index" class="mini-card">
        
        <div class="mini-header">
          <div class="mag-badge">{{ gempa.magnitude }} <small>SR</small></div>
          <span class="date">{{ gempa.tanggal }} • {{ gempa.jam }}</span>
        </div>
        
        <div class="mini-body">
          <strong class="wilayah-text">{{ gempa.wilayah }}</strong>
          
          <div class="detail-grid">
            <div class="detail-item">
              <span>Kedalaman</span>
              <strong>{{ gempa.kedalaman }}</strong>
            </div>
            <div class="detail-item">
              <span>Koordinat</span>
              <strong>{{ gempa.lintang }}, {{ gempa.bujur }}</strong>
            </div>
          </div>
          
          <div class="dirasakan-box" v-if="gempa.dirasakan && gempa.dirasakan !== '-'">
            <small>Dirasakan (MMI):</small>
            <span>{{ gempa.dirasakan }}</span>
          </div>

          <SimpleMap 
            :lat="gempa.lintang" 
            :lon="gempa.bujur" 
            :index="index"
            :magnitude="gempa.magnitude"
            :depth="gempa.kedalaman"
            :wilayah="gempa.wilayah"
          />
          
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import SimpleMap from './SimpleMap.vue'; 

const listGempa = ref([]);
const selectedProvinsi = ref("");
const loading = ref(true);
const error = ref(null);

const keywordMap = {
  'BENGKULU': ['BENGKULU', 'ENGGANO', 'MUKOMUKO', 'KAUR', 'BINTUHAN', 'KEPAHIANG', 'LEBONG', 'MUARA AMAN', 'REJANG', 'CURUP', 'SELUMA', 'TAIS', 'BENTENG', 'MANNA'],
  'JABAR': ['JABAR', 'JAWA BARAT', 'BANDUNG', 'CIANJUR', 'SUKABUMI', 'GARUT', 'TASIK', 'BOGOR', 'BEKASI', 'DEPOK', 'KARAWANG', 'PANGANDARAN', 'INDRAMAYU', 'MAJALENGKA', 'KUNINGAN', 'SUBANG', 'PURWAKARTA'],
  'JATENG': ['JATENG', 'JAWA TENGAH', 'SEMARANG', 'SOLO', 'SURAKARTA', 'BOYOLALI', 'KLATEN', 'CILACAP', 'KEBUMEN', 'BANYUMAS', 'PURWOKERTO', 'TEGAL', 'PEKALONGAN', 'BREBES', 'WONOSOBO', 'MAGELANG', 'JEPARA', 'KUDUS', 'PATI', 'REMBANG'],
  'JATIM': ['JATIM', 'JAWA TIMUR', 'SURABAYA', 'MALANG', 'BANYUWANGI', 'JEMBER', 'PACITAN', 'BLITAR', 'KEDIRI', 'MADIUN', 'PONOROGO', 'TUBAN', 'BOJONEGORO', 'LAMONGAN', 'GRESIK', 'SIDOARJO', 'MOJOKERTO'],
  'DIY': ['YOGYAKARTA', 'BANTUL', 'SLEMAN', 'KULON PROGO', 'GUNUNG KIDUL', 'DIY'],
  'BANTEN': ['BANTEN', 'LEBAK', 'PANDEGLANG', 'SERANG', 'CILEGON', 'TANGERANG'],
  'BALI': ['BALI', 'DENPASAR', 'BADUNG', 'GIANYAR', 'TABANAN', 'BULELENG', 'KARANGASEM', 'KLUNGKUNG', 'JEMBRANA'],
  'SUMBAR': ['SUMBAR', 'SUMATERA BARAT', 'PADANG', 'BUKITTINGGI', 'MENTAWAI', 'PARIAMAN', 'SOLOK', 'PASAMAN'],
  'LAMPUNG': ['LAMPUNG', 'PESISIR BARAT', 'TANGGAMUS', 'LIWA', 'KALIANDA'],
  'NTT': ['NTT', 'NUSA TENGGARA TIMUR', 'KUPANG', 'FLORES', 'SUMBA', 'ALOR', 'ROTE', 'MANGGARAI'],
  'NTB': ['NTB', 'NUSA TENGGARA BARAT', 'MATARAM', 'LOMBOK', 'SUMBAWA', 'BIMA', 'DOMPU'],
  'SULUT': ['SULUT', 'SULAWESI UTARA', 'MANADO', 'BITUNG', 'TOMOHON', 'MINAHASA', 'TALAUD', 'SANGIHE', 'BOLMONG'],
  'MALUKU': ['MALUKU', 'AMBON', 'SERAM', 'BURU', 'TUAL', 'SAUMLAKI'],
  'PAPUA': ['PAPUA', 'JAYAPURA', 'MERAUKE', 'NABIRE', 'BIAK', 'TIMIKA', 'WAMENA']
};

const filteredGempa = computed(() => {
  if (!selectedProvinsi.value) return listGempa.value;
  const targetKeywords = keywordMap[selectedProvinsi.value];
  if (!targetKeywords) {
    return listGempa.value.filter(gempa => gempa.wilayah.toUpperCase().includes(selectedProvinsi.value));
  }
  return listGempa.value.filter(gempa => {
    const wilayahUpper = gempa.wilayah.toUpperCase();
    return targetKeywords.some(keyword => wilayahUpper.includes(keyword));
  });
});

const fetchData = async () => {
  loading.value = true;
  try {
    // Ganti angkanya sesuai hasil ipconfig Anda
const res = await axios.get('http://192.168.8.153:3000/api/gempa-list');
    listGempa.value = res.data.data;
  } catch (err) {
    error.value = "Gagal mengambil data. Pastikan Backend (Port 3000) aktif.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => { fetchData(); });
</script>

<style scoped>
/* CONTAINER UTAMA (RESPONSIF) */
.dashboard { 
  max-width: 600px; 
  width: 100%;       /* Full width di HP */
  margin: 0 auto; 
  padding: 15px;     /* Padding aman */
  font-family: 'Segoe UI', sans-serif; 
  box-sizing: border-box; /* Agar padding tidak bikin scroll samping */
}

/* FILTER SECTION */
.filter-section { 
  background: linear-gradient(135deg, #2c3e50, #34495e); 
  color: white; padding: 15px; border-radius: 12px; margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;
}
.filter-section label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; }

/* DROPDOWN (Support iOS/Android Style) */
.prov-select {
  padding: 12px; font-size: 16px; border-radius: 8px; border: none; 
  width: 100%; /* Full Width */
  max-width: 100%; 
  cursor: pointer; outline: none;
  background: white; color: #333; font-weight: 500;
  -webkit-appearance: none; /* Penting untuk iPhone */
  appearance: none;
  text-align: center;
}

/* KARTU GEMPA */
.mini-card {
  background: white; border-radius: 12px; margin-bottom: 20px; 
  overflow: hidden; border: 1px solid #eee;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
}

.mini-header { 
  background: #fdfdfd; padding: 12px 15px; border-bottom: 1px solid #f0f0f0;
  display: flex; justify-content: space-between; align-items: center;
}
.mag-badge { 
  background: #e74c3c; color: white; padding: 4px 12px; border-radius: 20px; 
  font-weight: bold; font-size: 0.9rem;
}
.date { font-size: 0.75rem; color: #95a5a6; font-weight: 500; }

.mini-body { padding: 15px; }
.wilayah-text { display: block; font-size: 1rem; color: #2c3e50; margin-bottom: 15px; line-height: 1.4; }

/* GRID DETAIL */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
.detail-item { background: #f8f9fa; padding: 10px; border-radius: 6px; }
.detail-item span { display: block; font-size: 0.7rem; color: #7f8c8d; margin-bottom: 2px; text-transform: uppercase; }
.detail-item strong { display: block; font-size: 0.85rem; color: #34495e; }

.dirasakan-box { 
  background: #fff8e1; border-left: 4px solid #f1c40f; padding: 10px; border-radius: 4px; margin-bottom: 15px;
}
.dirasakan-box small { display: block; font-weight: bold; color: #f39c12; margin-bottom: 3px; font-size: 0.75rem; }
.dirasakan-box span { font-size: 0.9rem; color: #555; }

/* UTILS */
.empty-state { text-align: center; padding: 30px 15px; color: #7f8c8d; background: #f8f9fa; border-radius: 12px; border: 2px dashed #dcdcdc; }
.loading, .error { text-align: center; margin-top: 40px; color: #666; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* MEDIA QUERY KHUSUS LAYAR KECIL (HP) */
@media (max-width: 480px) {
  .dashboard { padding: 10px; }
  .mini-header { padding: 10px; }
  .mag-badge { font-size: 0.8rem; padding: 3px 8px; }
  .wilayah-text { font-size: 0.95rem; }
}
</style>