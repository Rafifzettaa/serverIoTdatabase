import express from 'express';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json()); // Supaya bisa membaca format JSON dari ESP32

// Inisialisasi koneksi ke Turso menggunakan Environment Variables
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Endpoint untuk menerima data dari ESP32
app.post('/api/save-telemetry', async (req, res) => {
  // Destructuring seluruh variabel sesuai kolom di image_efe326.png
  const {
    dosing_interval_seconds,
    ph,
    ph_high,
    ph_low,
    ph_valid,
    relay1,
    relay2,
    relay3,
    relay4,
    tds,
    tds_target,
    temp,
    temp_valid,
    water,
    ph_raw,
    ph_volt
  } = req.body;

  // Validasi minimal: pastikan data esensial tidak kosong
  if (ph === undefined || tds === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: "Gagal menyimpan: Data pH atau TDS kosong!" 
    });
  }

  const query = `
    INSERT INTO log_sensor_lengkap (
      dosing_interval_seconds, ph, ph_high, ph_low, ph_valid,
      relay1, relay2, relay3, relay4, tds, tds_target,
      temp, temp_valid, water, ph_raw, ph_volt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    dosing_interval_seconds ?? null,
    ph,
    ph_high ?? null,
    ph_low ?? null,
    ph_valid ?? 0,
    relay1 ?? 0,
    relay2 ?? 0,
    relay3 ?? 0,
    relay4 ?? 0,
    tds,
    tds_target ?? null,
    temp ?? null,
    temp_valid ?? 0,
    water ?? null,
    ph_raw ?? null,
    ph_volt ?? null
  ];

  try {
    await turso.execute({ sql: query, args: values });
    return res.status(200).json({ 
      success: true, 
      message: "Data skripsi berhasil diamankan ke Turso!" 
    });
  } catch (error) {
    console.error("Turso Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Gagal menulis ke database" 
    });
  }
});

// const PORT = process.getProcess ? process.env.PORT || 3000 : 3000;
// app.listen(PORT, () => {
//   console.log(`Backend perantara aktif di port ${PORT}`);
// });
export default app;