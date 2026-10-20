# Peta Ekonomi Indonesia

Dashboard isometrik 3D: 38 provinsi diekstrusi menurut PDRB 2025 (harga konstan 2010). Klik provinsi untuk masuk ke diorama 17 lapangan usaha.

Demo: https://rayhanalirachman.github.io/dashboard_pdrb/

## Sumber data

- PDRB dan PDB lapangan usaha: Badan Pusat Statistik (BPS), WebAPI. 2024 angka sementara, 2025 angka sangat sementara.
- Batas provinsi: [denyherianto/indonesia-geojson-topojson-maps-with-38-provinces](https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces), lisensi CC BY 4.0 (disederhanakan).
- Data mentah: `pdb_nasional_lapangan_usaha.csv`, `pdrb_provinsi_17_kategori.csv`.

## Menjalankan lokal

Aplikasi statis (tanpa build, tanpa backend): `index.html` + `main.js` + `adegan.js` + `gaya.css` + `data.json`.
Three.js 0.183.2 disimpan lokal di `vendor/three/`.

```sh
python3 -m http.server 8000
# buka http://localhost:8000
```

Harus lewat server (bukan `file://`), karena `data.json` dimuat dengan `fetch`.

## GitHub Pages

Settings → Pages → Deploy from branch → `main` → folder `/ (root)`.
Tautan langsung ke diorama: `.../dashboard_pdrb/#Jawa%20Timur`.

## Mengganti data

Timpa `data.json` dengan keluaran `desain/skrip/prep.py` (struktur sama: `sektor`, `provinsi[].rings/sektor/pdrb`, `nasional`).

## Berkas

- `main.js`: Beranda (peta 38 provinsi), diorama (tata letak petak, 5 lensa, panel), transisi, kamera.
- `adegan.js`: 17 adegan sektor 3D + animasinya, partikel asap/debu/uap, ikon daftar.
- `desain/`: data.json sumber, skrip pembentuk, dan mockup Design canvas (`.dc.html`, hanya terbuka di Design canvas).
