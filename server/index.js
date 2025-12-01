const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Izinkan Frontend (Vue) mengakses Backend ini
app.use(cors());

// Route Utama
app.get('/api/gempa', async (req, res) => {
    try {
        // 1. Ambil data XML dari BMKG
        const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.xml');
        
        // 2. Ubah ke JSON
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);
        const gempa = result.Infogempa.gempa;

        // 3. Deteksi Tsunami (Logika Sederhana)
        const potensiText = gempa.Potensi || "";
        // Jika ada kata TSUNAMI dan TIDAK ada kata "Tidak", maka Bahaya.
        const isTsunami = potensiText.includes("TSUNAMI") && !potensiText.includes("Tidak");

        // 4. Kirim Data Bersih
        res.json({
            success: true,
            data: {
                tanggal: gempa.Tanggal,
                jam: gempa.Jam,
                lintang: gempa.Lintang,
                bujur: gempa.Bujur,
                magnitude: gempa.Magnitude,
                kedalaman: gempa.Kedalaman,
                wilayah: gempa.Wilayah,
                potensi: gempa.Potensi,
                is_tsunami: isTsunami,
                shakemap: `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`
            }
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, message: "Gagal mengambil data BMKG" });
    }
});
// ... kode import dan app.use(cors) di atas tetap sama ...

// ENDPOINT BARU: Ambil Daftar 15 Gempa Terakhir (Dirasakan)
app.get('/api/gempa-list', async (req, res) => {
    try {
        // Kita gunakan endpoint 'gempadirasakan.xml' karena isinya adalah list gempa (Array)
        const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.xml');
        
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);
        
        // Data gempa ada di result.Infogempa.gempa
        // Jika gempa cuma 1, dia object. Jika banyak, dia Array. Kita paksa jadi Array.
        let gempaList = result.Infogempa.gempa;
        if (!Array.isArray(gempaList)) {
            gempaList = [gempaList];
        }

        // Kita map data agar rapi
        const cleanData = gempaList.map(gempa => ({
            tanggal: gempa.Tanggal,
            jam: gempa.Jam,
            lintang: gempa.Lintang,
            bujur: gempa.Bujur,
            magnitude: gempa.Magnitude,
            kedalaman: gempa.Kedalaman,
            wilayah: gempa.Wilayah, // Ini kuncinya, nanti kita filter teks ini
            dirasakan: gempa.Dirasakan
        }));

        res.json({ success: true, data: cleanData });

    } catch (error) {
        console.error("Error list:", error.message);
        res.status(500).json({ success: false, message: "Gagal ambil list gempa" });
    }
});

// ... app.listen di bawah tetap sama ...
app.listen(PORT, () => {
    console.log(`[SERVER] Backend berjalan di http://localhost:${PORT}`);
});