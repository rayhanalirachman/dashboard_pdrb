"""Build data.json: simplified 38-province geometry (planar 0..1000) + BPS PDRB per sector.
Usage: python3 -I prep.py <geojson> <csv> <out.json>"""
import csv, json, math, sys

geo_path, csv_path, out_path = sys.argv[1:4]
nas_path = sys.argv[4] if len(sys.argv) > 4 else None  # pdb_nasional_lapangan_usaha.csv (opsional)

NAME_FIX = {"Daerah Istimewa Yogyakarta": "DI Yogyakarta",
            "Kepulauan Bangka Belitung": "Kep. Bangka Belitung",
            "Kepulauan Riau": "Kep. Riau"}
SEKTOR = [  # kode, label pendek, ikon diorama
    ("A", "Pertanian, Kehutanan & Perikanan", "sawit"),
    ("B", "Pertambangan & Penggalian", "tambang"),
    ("C", "Industri Pengolahan", "pabrik"),
    ("D", "Listrik & Gas", "listrik"),
    ("E", "Air, Sampah & Daur Ulang", "air"),
    ("F", "Konstruksi", "crane"),
    ("G", "Perdagangan & Reparasi", "toko"),
    ("H", "Transportasi & Pergudangan", "kontainer"),
    ("I", "Akomodasi & Makan Minum", "hotel"),
    ("J", "Informasi & Komunikasi", "menara"),
    ("K", "Jasa Keuangan & Asuransi", "bank"),
    ("L", "Real Estat", "rumah"),
    ("M,N", "Jasa Perusahaan", "kantor"),
    ("O", "Administrasi Pemerintahan", "pemda"),
    ("P", "Jasa Pendidikan", "sekolah"),
    ("Q", "Jasa Kesehatan", "rs"),
    ("R,S,T,U", "Jasa Lainnya", "taman"),
]
LON0, LAT0, K = 95.0, 6.2, 1000 / 46.2  # planar: x=(lon-95)*K, y=(6.2-lat)*K


def dp(pts, eps):
    """Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-12
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return dp(pts[:idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def dp_ring(r, eps):
    """DP on a closed ring: split at the midpoint so both halves have distinct ends."""
    m = len(r) // 2
    return dp(r[:m + 1], eps)[:-1] + dp(r[m:], eps)


def area(r):
    return abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2


geo = json.load(open(geo_path))
provs = {}
for f in geo["features"]:
    name = NAME_FIX.get(f["properties"]["PROVINSI"], f["properties"]["PROVINSI"])
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    rings = []
    for poly in polys:
        outer = [((lon - LON0) * K, (LAT0 - lat) * K) for lon, lat in poly[0]]  # holes dropped
        rings.append(outer)
    rings.sort(key=area, reverse=True)
    big = area(rings[0])
    keep = []
    for r in rings:
        # drop tiny islets: keep largest ring always, others if > 22 sq units (~0.05 deg^2) or > 8% of largest
        if r is rings[0] or area(r) > 22 or area(r) > 0.08 * big:
            s = dp_ring(r, 0.9)
            if r is rings[0] and len(s) < 6:  # tiny province (DKI): keep its shape at finer tolerance
                s = dp_ring(r, 0.15)
            if len(s) >= 4:
                keep.append(s[:-1] if s[0] == s[-1] else s)
    cx = sum(p[0] for p in keep[0]) / len(keep[0])
    cy = sum(p[1] for p in keep[0]) / len(keep[0])
    provs[name] = {"nama": name, "kode": f["properties"]["KODE_PROV"],
                   "cx": round(cx, 1), "cy": round(cy, 1),
                   "rings": [" ".join(f"{x:.1f},{y:.1f}" for x, y in r) for r in keep]}

kode_of = {s[0]: s for s in SEKTOR}
for row in csv.DictReader(open(csv_path, encoding="utf-8-sig")):
    p = provs[row["provinsi"]]
    harga = "berlaku" if "Berlaku" in row["jenis_harga"] else "konstan"
    key = f'{row["tahun"]}_{harga}'
    lu = row["lapangan_usaha"]
    v = round(float(row["nilai"]), 2)
    if lu.startswith("Produk Domestik"):
        p.setdefault("pdrb", {})[key] = v
    else:
        kode = lu.split(" ")[0]
        p.setdefault("sektor", {}).setdefault(key, [None] * 17)[[s[0] for s in SEKTOR].index(kode)] = v

out = {
    "meta": {
        "judul": "PDRB 38 Provinsi menurut Lapangan Usaha",
        "satuan": "miliar rupiah",
        "sumber": "BPS, PDRB Provinsi menurut Lapangan Usaha (Seri 2010)",
        "catatan": "2024 angka sementara; 2025 angka sangat sementara",
        "geometri": "denyherianto/indonesia-geojson-topojson-maps-with-38-provinces (CC BY 4.0), disederhanakan Douglas-Peucker; pulau sangat kecil dihapus",
        "proyeksi": "planar ekuirektangular: x=(lon-95)*21.645, y=(6.2-lat)*21.645",
        "kunci": ["2024_berlaku", "2025_berlaku", "2024_konstan", "2025_konstan"],
    },
    "sektor": [{"kode": k, "nama": n, "ikon": i} for k, n, i in SEKTOR],
    "provinsi": sorted(provs.values(), key=lambda p: p["kode"]),
}
if nas_path:  # PDB nasional dari BPS (var 65), bukan jumlah 38 provinsi
    pdb, sek_nas = {}, {}
    kode_list = [s[0] for s in SEKTOR]
    for row in csv.DictReader(open(nas_path, encoding="utf-8-sig")):
        harga = "berlaku" if "Berlaku" in row["jenis_harga"] else "konstan"
        key = f'{row["tahun"]}_{harga}'
        kat = row["kategori"].replace("<b>", "").replace("</b>", "").strip()
        if "PRODUK DOMESTIK BRUTO" in kat:
            pdb[key] = round(float(row["nilai"]), 2)
            continue
        kode = kat.split(".")[0].strip()  # hanya baris kategori 17 sektor (huruf), bukan subsektor bernomor
        if row["kategori"].startswith("<b>") and kode in kode_list and "NILAI TAMBAH" not in kat and "PAJAK" not in kat:
            sek_nas.setdefault(key, [None] * 17)[kode_list.index(kode)] = round(float(row["nilai"]), 2)
    assert all(None not in v for v in sek_nas.values()), sek_nas
    out["nasional"] = {"sumber": "BPS var 65, PDB menurut lapangan usaha (Seri 2010), baris C. Produk Domestik Bruto", "pdb": pdb, "sektor": sek_nas,
                       "tumbuh_riil_2025": round((pdb["2025_konstan"] / pdb["2024_konstan"] - 1) * 100, 4)}
for p in out["provinsi"]:
    assert len(p["pdrb"]) == 4 and all(None not in v for v in p["sektor"].values()), p["nama"]
json.dump(out, open(out_path, "w"), ensure_ascii=False, separators=(",", ":"))
pts = sum(len(r.split(" ")) for p in out["provinsi"] for r in p["rings"])
print("provinsi", len(out["provinsi"]), "titik", pts, "ring", sum(len(p["rings"]) for p in out["provinsi"]))
