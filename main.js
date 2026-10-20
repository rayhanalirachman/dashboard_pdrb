// Dashboard PDRB isometrik: Beranda (peta 38 provinsi) <-> Diorama provinsi (17 adegan sektor).
// Satu scene Three.js, satu kamera ortografik; transisi = kamera + pulau provinsi yang sama diinterpolasi.
import * as THREE from 'three';
import { buatAdegan, warnai, Kepulan, buatIkon } from './adegan.js';

const W = 1440, H = 900;
const KEY = '2025_konstan', LALU = '2024_konstan', BERLAKU = '2025_berlaku';
const $ = (s) => document.querySelector(s);
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const diam = () => mq.matches;

// ---------- format angka (sama dengan artboard) ----------
const nf1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rp = (v) => 'Rp ' + nf1.format(v / 1000) + ' T';
const pct = (v) => nf1.format(v) + '%';
const sgn = (g) => (g >= 0 ? '+' : '−') + pct(Math.abs(g));
const pp = (x) => (x >= 0 ? '+' : '−') + nf2.format(Math.abs(x)) + ' poin';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // ~ cubic-bezier(.65,0,.35,1)
const keluarBalik = (t) => { const c1 = 1.70158 * 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

// ---------- kamera & tata letak (dari Beranda 7c dan Diorama H) ----------
const CAM_PETA = { a: -6, sq: 0.8, s: 1.2, ax: 96, ay: 330, Tx: 0, Ty: 0, Tz: 0 };
const HMAX = 115, BASE = 4; // px layar
const V = { a: -8, sq: 0.66, lebar: 800, tinggi: 330, cx: 490, cy: 478, tebal: 26 };
const Y_DIO = 60;            // tinggi permukaan pulau diorama (dunia)
const RMIN = 12, RMAX = 100;
const SKALA = [-5, 10];
const posisi = (g) => ((clamp(g, SKALA[0], SKALA[1]) - SKALA[0]) / (SKALA[1] - SKALA[0]) * 100).toFixed(1) + '%';
const ce = (sq) => Math.sqrt(1 - sq * sq);
const pxKeY = (px, k) => px / (k.s * ce(k.sq)); // tinggi layar -> tinggi dunia

const WARNA_PETA = {
  t: ['#E9E9E8', '#D4D4D3', '#B5B5B4', '#888887', '#4B4B4A'],
  k: ['#D6D6D5', '#C3C3C2', '#A7A7A6', '#7D7D7C', '#454544'],
};
const BATA = '#E4572E', BATA2 = '#C2441F', PULAU_ATAS = '#EDEDEC', PULAU_SISI = '#D6D6D5';
const ABU = ['#E9E9E8', '#B5B5B4', '#7D7D7C', '#3E3E3D'];

// ---------- panggung: 1440x900 diskalakan pas layar ----------
const panggung = $('#panggung');
let skalaPanggung = 1;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#kanvas'), antialias: true, powerPreference: 'high-performance' }); } catch (e) {
  $('#pesan').textContent = 'Browser ini tidak dapat menjalankan WebGL, jadi peta 3D tidak bisa ditampilkan. Coba aktifkan akselerasi grafis atau gunakan browser lain.';
  throw e;
}
renderer.setClearColor(0xFCFCFB, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
function ukurUlang() {
  skalaPanggung = Math.min(innerWidth / W, innerHeight / H);
  panggung.style.transform = `translate(${-W * skalaPanggung / 2}px,${-H * skalaPanggung / 2}px) scale(${skalaPanggung})`;
  renderer.setPixelRatio(Math.min(2, (devicePixelRatio || 1) * skalaPanggung));
  renderer.setSize(W, H, true);
}
addEventListener('resize', ukurUlang);
ukurUlang();

const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 8000);
const hemi = new THREE.HemisphereLight(0xffffff, 0xd9d6d0, 1.55);
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -760, right: 760, top: 760, bottom: -760, near: 10, far: 4000 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.6;
sun.shadow.radius = 3;
const SUN_OFF = new THREE.Vector3(-380, 820, 330);
scene.add(hemi, sun, sun.target);
const lantai = new THREE.Mesh(new THREE.PlaneGeometry(30000, 30000).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.09 }));
lantai.receiveShadow = true;
scene.add(lantai);
const kepulan = new Kepulan(320);
scene.add(kepulan.mesh);

const kamNow = { ...CAM_PETA };
function aturKamera(k) {
  const r = k.a * Math.PI / 180, ca = Math.cos(r), sa = Math.sin(r), c = ce(k.sq);
  const T = new THREE.Vector3(k.Tx, k.Ty, k.Tz);
  cam.up.set(-k.sq * sa, c, -k.sq * ca);
  cam.position.set(k.Tx + sa * c * 3000, k.Ty + k.sq * 3000, k.Tz + ca * c * 3000);
  cam.lookAt(T);
  cam.left = -k.ax / k.s; cam.right = (W - k.ax) / k.s; cam.top = k.ay / k.s; cam.bottom = -(H - k.ay) / k.s;
  cam.updateProjectionMatrix();
  Object.assign(kamNow, k);
}
const campurKam = (A, B, t) => Object.fromEntries(Object.keys(A).map((k) => [k, lerp(A[k], B[k], t)]));
function aturMatahari(x, z) {
  sun.target.position.set(x, 0, z);
  sun.position.set(x + SUN_OFF.x, SUN_OFF.y, z + SUN_OFF.z);
}
const _v = new THREE.Vector3();
function keLayar(x, y, z) { _v.set(x, y, z).project(cam); return [(_v.x + 1) / 2 * W, (1 - _v.y) / 2 * H]; }

// ---------- status ----------
const S = { data: null, fase: 'memuat', hover: null, pilih: 'Jawa Timur', lensa: 'porsi', sektor: null, t0: 0 };
let PROV = [], nasG = 0, totPDRB = 0, urut = [];
let dio = null; // diorama aktif

// ================= BERANDA =================
function bangunPeta(d) {
  const vmax = Math.max(...d.provinsi.map((p) => p.pdrb[KEY]));
  const gr = (p) => (p.pdrb[KEY] / p.pdrb[LALU] - 1) * 100;
  urut = d.provinsi.slice().sort((a, b) => b.pdrb[KEY] - a.pdrb[KEY]).map((p) => p.nama);
  const urutG = d.provinsi.slice().sort((a, b) => gr(b) - gr(a)).map((p) => p.nama);
  totPDRB = d.provinsi.reduce((a, p) => a + p.pdrb[KEY], 0);
  const pdb = d.nasional.pdb;
  nasG = d.nasional.tumbuh_riil_2025 ?? (pdb[KEY] / pdb[LALU] - 1) * 100;
  PROV = d.provinsi.map((p) => {
    const rank = urut.indexOf(p.nama), kl = 4 - Math.floor(rank * 5 / urut.length);
    const rings = p.rings.map((rs) => rs.split(' ').map((t) => t.split(',').map(Number)));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    rings.forEach((r) => r.forEach(([x, z]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }));
    const bx = (x0 + x1) / 2, bz = (z0 + z1) / 2;
    const shapes = rings.map((r) => new THREE.Shape(r.map(([x, z]) => new THREE.Vector2(x - bx, -(z - bz)))));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(-Math.PI / 2);
    const mAtas = new THREE.MeshLambertMaterial({ color: WARNA_PETA.t[kl], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const mSisi = new THREE.MeshLambertMaterial({ color: WARNA_PETA.k[kl] });
    const mesh = new THREE.Mesh(geo, [mAtas, mSisi]);
    mesh.castShadow = mesh.receiveShadow = true;
    const seg = [];
    rings.forEach((r) => r.forEach(([x, z], i) => { const [x2, z2] = r[(i + 1) % r.length]; seg.push(x - bx, 1, z - bz, x2 - bx, 1, z2 - bz); }));
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const mGaris = new THREE.LineBasicMaterial({ color: 0xFCFCFB });
    const garis = new THREE.LineSegments(lg, mGaris);
    mesh.add(garis);
    const grup = new THREE.Group();
    grup.position.set(bx, 0, bz);
    grup.add(mesh);
    scene.add(grup);
    const pr = { p, nama: p.nama, rank, kl, g: gr(p), rankG: urutG.indexOf(p.nama), rings, bx, bz,
      Hp: BASE + p.pdrb[KEY] / vmax * HMAX, grup, mesh, garis, mAtas, mSisi, mGaris, lift: 0, tumbuh: 0, layarY: 0 };
    pr.H = pxKeY(pr.Hp, CAM_PETA);
    mesh.userData.prov = pr;
    // urutan muncul = posisi layar dari atas (sama dengan artboard)
    pr.layarY = CAM_PETA.s * CAM_PETA.sq * (p.cx * Math.sin(CAM_PETA.a * Math.PI / 180) + p.cy * Math.cos(CAM_PETA.a * Math.PI / 180));
    return pr;
  });
  PROV.slice().sort((a, b) => a.layarY - b.layarY).forEach((pr, i) => { pr.delay = i * 35; });
  $('#nas-teks').textContent = sgn(nasG);
}
const provBy = (nama) => PROV.find((x) => x.nama === nama);

function warnaProv(pr, on) {
  pr.mAtas.color.set(on ? BATA : WARNA_PETA.t[pr.kl]);
  pr.mSisi.color.set(on ? BATA2 : WARNA_PETA.k[pr.kl]);
  pr.mGaris.color.set(on ? 0xFFFFFF : 0xFCFCFB);
}

function renderTop5() {
  const vTop = provBy(urut[0]).p.pdrb[KEY];
  $('#top5').innerHTML = urut.slice(0, 5).map((nama, i) => {
    const x = provBy(nama), val = x.p.pdrb[KEY];
    return `<button class="baris${nama === S.pilih ? ' on' : ''}" data-prov="${esc(nama)}" type="button">
      <span class="bulat">${i + 1}</span><span>${esc(nama)}</span><span style="font-weight:900;font-size:14px">${rp(val)}</span>
      <span class="tumbuh${x.g < 0 ? ' turun' : ''}">${x.g >= 0 ? '▲ ' : '▼ '}${pct(Math.abs(x.g))}</span>
      <span class="batang"><i style="width:${(val / vTop * 100).toFixed(1)}%"></i></span></button>`;
  }).join('');
}
function renderKartu() {
  const fp = provBy(S.hover || S.pilih), v = fp.p.pdrb[KEY], g = fp.g;
  const sek = fp.p.sektor[KEY], si = sek.indexOf(Math.max(...sek));
  const luar = g < SKALA[0] || g > SKALA[1];
  const banding = g < 0 ? 'Ekonominya menyusut riil.' : g >= nasG ? 'Lebih cepat dari pertumbuhan nasional.' : 'Lebih lambat dari pertumbuhan nasional.';
  const sel = provBy(S.pilih);
  $('#terpilih').innerHTML = `<div><span class="kecil">${S.hover && S.hover !== S.pilih ? 'Di bawah kursor' : 'Provinsi terpilih'}</span>
    <h2>${esc(fp.nama)}</h2>
    <p class="nilai"><b>${rp(v)}</b> · #${fp.rank + 1} dari 38 · porsi ${pct(v / totPDRB * 100)}</p></div>
    <div class="kotak-putih"><div class="atas"><span class="kecil">Pertumbuhan riil 2024→2025</span><b class="${g < 0 ? 'turun' : ''}">${sgn(g)}</b></div>
    <div class="skala"><span class="nol" style="left:33.3%"></span><span class="nas" style="left:${posisi(nasG)}"></span><span class="titik" style="left:${posisi(g)};background:${g < 0 ? '#C2441F' : '#1F1F1F'}"></span></div>
    <div class="kecil skala-teks"><span style="left:0">−5%</span><span style="left:33.3%;transform:translateX(-50%)">0</span><span style="left:${posisi(nasG)};transform:translateX(-50%);color:#1F1F1F">nasional ${sgn(nasG)}</span><span style="right:0">+10%</span></div>
    <p class="gteks">Laju #${fp.rankG + 1} dari 38. ${banding}${luar ? ' Nilainya di luar skala −5 sampai +10%.' : ''}</p></div>
    <p class="terbesar">Sektor terbesar: <b>${esc(S.data.sektor[si].nama)}</b> (${pct(sek[si] / v * 100)})</p>
    <button class="tombol" id="tbl-masuk" type="button">Masuk ke diorama ${esc(sel.nama)}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`;
}
function pilihProv(nama) {
  if (S.pilih === nama) return;
  warnaProv(provBy(S.pilih), false);
  S.pilih = nama;
  warnaProv(provBy(nama), true);
  renderTop5(); renderKartu();
}

// label (nomor top-5 + pin) diproyeksikan dari 3D tiap frame
const labelEl = $('#label');
let labelNodes = null;
function siapLabel() {
  labelEl.innerHTML = urut.slice(0, 5).map((n, i) => `<div class="nomor" data-n="${esc(n)}">${i + 1}</div>`).join('') + '<div class="pin"></div>';
  labelNodes = { nomor: [...labelEl.querySelectorAll('.nomor')], pin: labelEl.querySelector('.pin') };
}
function updateLabel(tampil) {
  labelEl.style.opacity = tampil;
  labelEl.style.display = tampil > 0 ? '' : 'none';
  if (!tampil) return;
  const fokus = S.hover || S.pilih;
  labelNodes.nomor.forEach((el) => {
    const pr = provBy(el.dataset.n);
    if (pr.nama === fokus) { el.style.display = 'none'; return; }
    el.style.display = '';
    const [x, y] = keLayar(pr.p.cx, pr.grup.position.y, pr.p.cy);
    el.style.left = x.toFixed(1) + 'px'; el.style.top = (y - 4).toFixed(1) + 'px';
  });
  const pr = provBy(fokus);
  const [x, y] = keLayar(pr.p.cx, pr.grup.position.y, pr.p.cy);
  labelNodes.pin.textContent = pr.nama + ' · ' + sgn(pr.g);
  labelNodes.pin.style.left = x.toFixed(1) + 'px';
  labelNodes.pin.style.top = (y - 12 + Math.sin(performance.now() / 3000 * Math.PI * 2) * 3).toFixed(1) + 'px';
}

// ================= DIORAMA =================
function ukur(d, p) { // semua ukuran per sektor, hanya dari data (PDRB provinsi + PDB nasional)
  const t25 = p.pdrb[KEY], t24 = p.pdrb[LALU], tb = p.pdrb[BERLAKU], tb24 = p.pdrb['2024_berlaku'];
  const nas = d.nasional.sektor[KEY], ntb = nas.reduce((a, b) => a + b, 0);
  const naik = (b25, k25, b24, k24) => ((b25 / k25) / (b24 / k24) - 1) * 100; // deflator implisit
  return { prov: { t25, t24, tb, g: (t25 / t24 - 1) * 100, infl: naik(tb, t25, tb24, t24), nasG },
    sek: d.sektor.map((s, i) => {
      const v = p.sektor[KEY][i], v0 = p.sektor[LALU][i], vb = p.sektor[BERLAKU][i];
      return { ...s, i, v, v0, vb, porsi: v / t25 * 100, g: v0 ? (v / v0 - 1) * 100 : 0, sumb: (v - v0) / t24 * 100,
        lq: (v / t25) / (nas[i] / ntb), infl: naik(vb, v, p.sektor['2024_berlaku'][i], v0) };
    }) };
}
const LENSA = {
  porsi: { label: 'Porsi', kolom: 'nilai · porsi PDRB', m: (s) => s.porsi, teks: (s) => nf1.format(s.v / 1000) + ' T · ' + pct(s.porsi),
    jelas: 'Luas petak = porsi PDRB. Tiap sektor punya adegan kecil yang terus bekerja.',
    kelas: () => '', legenda: () => [['#B5B5B4', 'adegan sektor'], [BATA, 'sektor terpilih']] },
  tumbuh: { label: 'Tumbuh', kolom: 'tumbuh riil 2024→2025', m: (s) => s.g, teks: (s) => sgn(s.g), skala: [-10, 15],
    jelas: 'Laju riil tiap sektor (harga konstan 2010), 2025 dibanding 2024. Sektor negatif: adegannya melambat.',
    kelas: (s) => (s.g < 0 ? 'cn' : s.g < 3 ? 'c0' : s.g < 6 ? 'c1' : s.g < 10 ? 'c2' : 'c3'),
    legenda: () => [[BATA, 'menyusut'], [ABU[0], '0–3%'], [ABU[1], '3–6%'], [ABU[2], '6–10%'], [ABU[3], '≥ 10%']] },
  sumber: { label: 'Sumber tumbuh', kolom: 'sumbangan ke pertumbuhan', m: (s) => s.sumb, teks: (s) => pp(s.sumb),
    jelas: 'Sumbangan tiap sektor terhadap pertumbuhan provinsi (poin persen); jumlahnya = laju provinsi. Sektor negatif: adegannya melambat.',
    kelas: (s) => (s.sumb < 0 ? 'cn' : s.sumb < 0.1 ? 'c0' : s.sumb < 0.5 ? 'c1' : s.sumb < 1 ? 'c2' : 'c3'),
    legenda: () => [[BATA, 'menekan'], [ABU[0], '< 0,1'], [ABU[1], '0,1–0,5'], [ABU[2], '0,5–1'], [ABU[3], '≥ 1 poin']] },
  spesial: { label: 'Spesialisasi', kolom: 'LQ vs nasional', m: (s) => s.lq, teks: (s) => 'LQ ' + nf2.format(s.lq), ref: 1,
    jelas: 'Location quotient: porsi sektor di provinsi dibanding porsinya di PDB nasional. LQ > 1 = lebih menonjol dari nasional.',
    kelas: (s) => (s.lq < 0.5 ? 'c0' : s.lq < 1 ? 'c1' : s.lq < 2 ? 'c2' : 'c3'),
    legenda: () => [[ABU[0], '< 0,5'], [ABU[1], '0,5–1'], [ABU[2], '1–2'], [ABU[3], '≥ 2']] },
  harga: { label: 'Kenaikan harga', kolom: 'kenaikan harga 2025 vs 2024', m: (s) => s.infl, teks: (s) => sgn(s.infl),
    jelas: 'Seberapa naik harga hasil produksi tiap sektor dibanding 2024 (deflator implisit). Bukan inflasi belanja rumah tangga (IHK). Sektor negatif: adegannya melambat.',
    kelas: (s) => (s.infl < 0 ? 'cn' : s.infl < 1.5 ? 'c0' : s.infl < 3 ? 'c1' : s.infl < 5 ? 'c2' : 'c3'),
    legenda: () => [[BATA, 'harga turun'], [ABU[0], '0–1,5%'], [ABU[1], '1,5–3%'], [ABU[2], '3–5%'], [ABU[3], '≥ 5%']] },
};
const LESU_LENSA = new Set(['tumbuh', 'sumber', 'harga']);

function diDalam(x, y, ring) {
  let ok = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ok = !ok;
  }
  return ok;
}
// Pulau diorama: skala & pusat agar pas kotak 800x330 px; kandidat titik petak di darat/dekat pantai (koordinat dunia lokal).
function tataPulau(pr) {
  const r = V.a * Math.PI / 180, ca = Math.cos(r), sa = Math.sin(r);
  let u0 = 1e9, u1 = -1e9, w0 = 1e9, w1 = -1e9;
  pr.rings.forEach((rg) => rg.forEach(([x, z]) => {
    const X = x - pr.bx, Z = z - pr.bz, u = X * ca - Z * sa, w = X * sa + Z * ca;
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); w0 = Math.min(w0, w); w1 = Math.max(w1, w);
  }));
  const k = Math.min(V.lebar / (u1 - u0), V.tinggi / ((w1 - w0) * V.sq));
  const uc = (u0 + u1) / 2 * k, wc = (w0 + w1) / 2 * k;
  const off = [uc * ca + wc * sa, -uc * sa + wc * ca];
  const rings = pr.rings.map((rg) => rg.map(([x, z]) => [(x - pr.bx) * k - off[0], (z - pr.bz) * k - off[1]]));
  let luas = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  rings.forEach((rg) => {
    let A = 0;
    rg.forEach((q, i) => { const o = rg[(i + 1) % rg.length]; A += q[0] * o[1] - o[0] * q[1]; x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); });
    luas += Math.abs(A) / 2;
  });
  const seg = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const kotak = (x1 - x0) * (z1 - z0), jarang = luas < 0.2 * kotak;
  const cand = [], pantai = [], g = 26, sabuk = jarang ? 64 : 34;
  for (let z = z0 + g / 3; z < z1; z += g) for (let x = x0 + g / 3; x < x1; x += g) {
    const di = rings.some((rg) => diDalam(x, z, rg));
    let jr = 1e9;
    rings.forEach((rg) => rg.forEach((a, i) => { jr = Math.min(jr, seg(x, z, a, rg[(i + 1) % rg.length])); }));
    if (di || jr < sabuk) { cand.push([x, z]); pantai.push(di ? jr : -jr); }
  }
  return { k, off, cand, pantai, luas: Math.max(luas, 0.3 * kotak), T: [pr.bx + off[0], pr.bz + off[1]] };
}
// Petak: terbesar dulu, di titik paling lega, sedikit tertarik ke tengah; kecilkan semua bila bertumpuk. Luas ∝ porsi.
function susunPetak(pl, sek) {
  const C = pl.cand, mx = C.reduce((a, q) => a + q[0], 0) / C.length, my = C.reduce((a, q) => a + q[1], 0) / C.length;
  const ur = sek.slice().sort((a, b) => b.porsi - a.porsi);
  let skala = Math.sqrt(0.5 * pl.luas / Math.PI), terbaik = null, nilai = -1e9;
  for (let it = 0; it < 40; it++) {
    const put = [];
    let buruk = 0;
    for (const s of ur) {
      const rAsli = skala * Math.sqrt(Math.max(0, s.porsi) / 100), r = Math.min(RMAX, Math.max(RMIN, rAsli));
      let bi = 0, bs = -1e9, bc = -1e9, ci = 0;
      C.forEach(([x, y], i) => {
        let cl = 1e6;
        put.forEach((q) => { cl = Math.min(cl, Math.hypot(x - q.x, y - q.z) - q.r - r); });
        if (cl > bc) { bc = cl; ci = i; }
        const sc = Math.min(cl, 0.5 * (pl.pantai[i] - 0.6 * r)) - 0.03 * Math.hypot(x - mx, y - my);
        if (cl >= -0.05 * r && sc > bs) { bs = sc; bi = i; }
      });
      if (bs === -1e9) bi = ci; else bc = Math.max(-0.05 * r, Math.min(bc, 0));
      buruk = Math.min(buruk, bc / r);
      put.push({ s, x: C[bi][0], z: C[bi][1], r, laut: pl.pantai[bi] < 0, kecil: rAsli < RMIN });
    }
    if (buruk > nilai) { nilai = buruk; terbaik = put; }
    if (buruk >= -0.05) break;
    skala *= 0.93;
  }
  return terbaik;
}

function bangunDiorama(pr) {
  const u = ukur(S.data, pr.p);
  const pl = tataPulau(pr);
  const petak = susunPetak(pl, u.sek);
  const grup = new THREE.Group();
  grup.position.set(pl.T[0], Y_DIO, pl.T[1]);
  scene.add(grup);
  const adegan = petak.map((q) => {
    const sc = buatAdegan(q.s.ikon, { laut: q.laut });
    sc.kode = q.s.kode; sc.s = q.s; sc.r = q.r; sc.kecil = q.kecil;
    sc.root.position.set(q.x, 5 * q.r / 60, q.z);
    sc.root.scale.setScalar(q.r / 60);
    sc.root.traverse((o) => { o.userData.kode = q.s.kode; });
    sc.isi.visible = false;
    sc.laju = 1; sc.waktu = Math.random() * 20;
    grup.add(sc.root);
    return sc;
  });
  const cam = { a: V.a, sq: V.sq, s: 1, ax: V.cx, ay: V.cy, Tx: pl.T[0], Ty: Y_DIO, Tz: pl.T[1] };
  return { pr, u, pl, grup, adegan, cam, tebal: pxKeY(V.tebal, cam), mulai: 0 };
}
function buangDiorama() {
  if (!dio) return;
  scene.remove(dio.grup);
  dio.adegan.forEach((sc) => sc.buang());
  dio = null;
}

// status turunan diorama
function effKode() { return S.sektor || dio.u.sek.slice().sort((a, b) => b.v - a.v)[0].kode; }
function kelasSektor(x) {
  const Ld = LENSA[S.lensa];
  return S.lensa === 'porsi' ? (x.kode === effKode() ? 'sorot' : '') : Ld.kelas(x);
}
function warnaiDiorama() {
  const Ld = LENSA[S.lensa];
  dio.adegan.forEach((sc) => {
    warnai(sc, kelasSektor(sc.s), S.sektor && sc.kode !== S.sektor);
    sc.lajuTarget = LESU_LENSA.has(S.lensa) && Ld.m(sc.s) < 0 ? 1 / 2.6 : 1;
  });
}
function peringkatLensa() {
  const Ld = LENSA[S.lensa];
  return dio.u.sek.slice().sort((a, b) => Ld.m(b) - Ld.m(a)).map((x) => x.kode);
}

let ikonURL = null;
function renderDioUI() {
  const u = dio.u, sek = u.sek, Lid = S.lensa, Ld = LENSA[Lid], p = dio.pr.p;
  const rank = S.data.provinsi.filter((q) => q.pdrb[KEY] > u.prov.t25).length + 1;
  const h1 = $('#dio-nama');
  h1.textContent = p.nama; h1.className = p.nama.length > 14 ? 'panjang' : '';
  $('#dio-chips').innerHTML = `<span class="chip" style="color:#C2441F">${rp(u.prov.t25)}</span><span class="chip">#${rank} dari 38</span>
    <span class="chip"><span class="${u.prov.g < 0 ? 'turun' : ''}">${u.prov.g >= 0 ? '▲ ' : '▼ '}${pct(Math.abs(u.prov.g))}</span> <span class="kecil">· nasional ${sgn(u.prov.nasG)}</span></span>`;
  $('#lensa').innerHTML = Object.keys(LENSA).map((id) => `<button type="button" role="tab" aria-selected="${id === Lid}" class="${id === Lid ? 'on' : ''}" data-lensa="${id}">${LENSA[id].label}</button>`).join('');
  $('#jelas').textContent = Ld.jelas;
  $('#legenda').innerHTML = Ld.legenda().map(([w, l]) => `<span><i style="background:${w}"></i>${l}</span>`).join('');
  $('#kolom').textContent = Ld.kolom;
  // daftar 17 sektor
  const vals = sek.map(Ld.m), ref = Ld.ref || 0;
  let lo = Math.min(ref, ...vals), hi = Math.max(ref, ...vals);
  if (Ld.skala) { lo = Ld.skala[0]; hi = Ld.skala[1]; }
  const ref2 = Lid === 'harga' ? u.prov.infl : ref, asal = Lid === 'harga' ? 0 : ref;
  lo = Math.min(lo, ref2, asal); hi = Math.max(hi, ref2);
  const neg = LESU_LENSA.has(Lid);
  const pos = (v) => (clamp(v, lo, hi) - lo) / (hi - lo) * 100;
  const eff = effKode();
  $('#daftar').innerHTML = sek.slice().sort((a, b) => Ld.m(b) - Ld.m(a)).map((x) => {
    const m = Ld.m(x), a = pos(Math.min(m, asal)), b = pos(Math.max(m, asal));
    const ik = ikonURL && ikonURL[x.ikon] ? `<img src="${ikonURL[x.ikon]}" alt="">` : '<span class="ik"></span>';
    return `<button type="button" class="brs${x.kode === eff ? ' on' : ''}" data-kode="${x.kode}">${ik}<span>${esc(x.nama)}</span>
      <span class="v${neg && m < 0 ? ' turun' : ''}">${Ld.teks(x)}</span>
      <span class="trek"><i class="${neg && m < 0 ? 'neg' : ''}" style="left:${a.toFixed(1)}%;width:${Math.max(0.8, b - a).toFixed(1)}%"></i><b style="left:${pos(ref2).toFixed(1)}%"></b></span></button>`;
  }).join('');
  const nKecil = dio.adegan.filter((q) => q.kecil).length;
  $('#catatan').textContent = {
    porsi: 'Total PDRB ' + rp(u.prov.t25) + ' (harga konstan 2010).' + (nKecil ? ' ' + nKecil + ' petak terkecil dibesarkan ke ukuran minimum agar terlihat.' : ''),
    tumbuh: 'Batang dipotong pada −10% dan +15%. Provinsi ' + sgn(u.prov.g) + ', nasional ' + sgn(u.prov.nasG) + '.',
    sumber: 'Jumlah semua sumbangan = ' + sgn(u.prov.g) + ' (laju provinsi).',
    spesial: 'Garis tegak = LQ 1 (sama dengan nasional). Pembanding: nilai tambah 17 sektor PDB nasional.',
    harga: 'Garis tegak = rata-rata seluruh ekonomi provinsi ' + sgn(u.prov.infl) + '.',
  }[Lid];
  // kartu sektor terpilih
  const se = sek.find((x) => x.kode === eff);
  const mini = [
    ['porsi', 'Nilai · porsi', nf1.format(se.v / 1000) + ' T · ' + pct(se.porsi), ''],
    ['tumbuh', 'Tumbuh riil', sgn(se.g), se.g < 0 ? 'turun' : ''],
    ['sumber', 'Sumbangan', pp(se.sumb), se.sumb < 0 ? 'turun' : ''],
    ['spesial', 'LQ vs nasional', nf2.format(se.lq), ''],
    ['harga', 'Kenaikan harga', sgn(se.infl), se.infl < 0 ? 'turun' : ''],
    ['', 'Nilai harga berlaku', rp(se.vb), ''],
  ];
  $('#sektor-kartu').innerHTML = `<div class="kepala"><b>${esc(se.nama)}</b><span class="kecil">sektor terpilih · semua ukuran</span></div>
    <div class="mini-grid">${mini.map(([id, l, n, c]) => `<div class="mini${id === Lid ? ' aktif' : ''}"><span>${l}</span><b class="${c}">${n}</b></div>`).join('')}</div>`;
  // balon
  const sc = dio.adegan.find((q) => q.kode === eff);
  const n100 = Math.round(se.porsi);
  const lesu = sc.lajuTarget < 1;
  $('#balon').innerHTML = `<p>${esc(se.nama)}</p><p class="besar">${Ld.teks(se)}</p><p>petak ${n100 < 1 ? '< 1' : n100}% luas diorama${lesu ? ' · adegan melambat' : ''}</p>`;
  dio.balonSc = sc;
}
function gantiLensa(id) {
  if (id === S.lensa || !dio) return;
  S.lensa = id;
  warnaiDiorama();
  const rk = peringkatLensa(), now = performance.now();
  dio.adegan.forEach((sc) => { sc.lompat = now + rk.indexOf(sc.kode) * 90; });
  renderDioUI();
}
function pilihSektor(kode) {
  S.sektor = S.sektor === kode ? null : kode;
  warnaiDiorama();
  renderDioUI();
}

// ================= TRANSISI =================
const DUR = { masuk: 1400, kembali: 1250, terbang: 900, jeda: 1000 };
function masuk(nama) {
  if (S.fase !== 'peta') return;
  pilihProv(nama);
  S.hover = null;
  buangDiorama();
  dio = bangunDiorama(provBy(nama));
  S.sektor = null;
  warnaiDiorama();
  renderDioUI();
  const now = performance.now(), rk = peringkatLensa(), jeda = diam() ? 0 : DUR.jeda;
  dio.adegan.forEach((sc) => { sc.lahir = now + jeda + (diam() ? 0 : rk.indexOf(sc.kode) * 90); sc.lompat = 0; });
  dio.balonMulai = now + jeda + (diam() ? 0 : 17 * 90);
  dio.dari = { top: provBy(nama).grup.position.y, tebal: provBy(nama).mesh.scale.y };
  PROV.forEach((pr) => { if (pr.nama !== nama) { pr.mAtas.transparent = pr.mSisi.transparent = pr.mGaris.transparent = true; pr.mAtas.needsUpdate = pr.mSisi.needsUpdate = true; } });
  S.fase = 'masuk'; S.t0 = now;
  $('#peta').classList.add('redup-ui');
  const d = $('#dio'); d.hidden = false; d.classList.add('redup-ui');
  panggung.style.cursor = '';
  try { history.replaceState(null, '', '#' + encodeURIComponent(nama)); } catch (e) { /* file:// */ }
}
function kembali() {
  if (S.fase !== 'dio') return;
  S.fase = 'kembali'; S.t0 = performance.now();
  $('#dio').classList.add('redup-ui', 'keluar');
  $('#balon').hidden = true;
  dio.adegan.forEach((sc) => { sc.susut = S.t0; });
  PROV.forEach((pr) => { pr.grup.visible = true; });
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
}

function petaPosisi(pr, now, dt) { // tinggi & angkat provinsi di Beranda
  const p = diam() ? 1 : clamp((now - S.mulaiPeta - pr.delay) / 700);
  pr.tumbuh = p <= 0 ? 0 : keluarBalik(p);
  const on = pr.nama === S.pilih, hov = pr.nama === S.hover;
  const target = on ? 12 + 3 * (1 - Math.cos(now / 3000 * Math.PI * 2)) : hov ? 7 : 0;
  pr.lift = diam() ? target : lerp(pr.lift, target, 1 - Math.exp(-dt * 12));
  const h = Math.max(0.001, pr.H * pr.tumbuh);
  pr.mesh.position.y = -h; pr.mesh.scale.y = h;
  pr.grup.position.y = h + pxKeY(pr.lift, CAM_PETA);
  pr.grup.scale.set(1, 1, 1);
}

const warnaA = new THREE.Color(), warnaB = new THREE.Color();
function warnaPulau(pr, t) { // t: 0 = bata (terpilih di peta), 1 = warna pulau diorama
  pr.mAtas.color.copy(warnaA.set(BATA)).lerp(warnaB.set(PULAU_ATAS), t);
  pr.mSisi.color.copy(warnaA.set(BATA2)).lerp(warnaB.set(PULAU_SISI), t);
  pr.mGaris.color.copy(warnaA.set(0xFFFFFF)).lerp(warnaB.set(0xFCFCFB), t);
}
function pulauDiorama(pr, e, bob) { // e: 0 = posisi peta (dio.dari), 1 = posisi diorama
  const sc = lerp(1, dio.pl.k, e);
  const top = lerp(dio.dari.top, Y_DIO, e) + bob;
  const teb = lerp(dio.dari.tebal, dio.tebal, e);
  pr.grup.scale.set(sc, 1, sc);
  pr.grup.position.y = top;
  pr.mesh.position.y = -teb; pr.mesh.scale.y = teb;
}
function lainPudar(nama, o) {
  PROV.forEach((pr) => {
    if (pr.nama === nama) return;
    pr.mAtas.opacity = pr.mSisi.opacity = pr.mGaris.opacity = o;
    pr.grup.visible = o > 0.01;
    const h = Math.max(0.001, pr.H * pr.tumbuh * (0.2 + 0.8 * o)); // tenggelam sambil memudar
    pr.mesh.position.y = -h; pr.mesh.scale.y = h; pr.grup.position.y = h;
    pr.mesh.castShadow = o > 0.5;
  });
}

// ================= LOOP =================
let tPrev = performance.now();
const pusatPeta = [500, 190];
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - tPrev) / 1000); tPrev = now;
  if (!S.data) return;
  const el = now - S.t0;
  let tampilLabel = 0;

  if (S.fase === 'peta') {
    aturKamera(CAM_PETA); aturMatahari(...pusatPeta);
    PROV.forEach((pr) => petaPosisi(pr, now, dt));
    tampilLabel = 1;
  } else if (S.fase === 'masuk' || S.fase === 'dio' || S.fase === 'kembali') {
    const pr = dio.pr, rm = diam();
    let e, ePudar, eWarna, bob = 0;
    if (S.fase === 'masuk') {
      e = rm ? 1 : inOut(clamp(el / DUR.terbang));
      ePudar = rm ? 1 : clamp((el - 100) / 500);
      eWarna = rm ? 1 : clamp((el - 750) / 450);
      if (rm || el > 850) $('#dio').classList.remove('redup-ui');
      if (rm || el >= DUR.masuk) { S.fase = 'dio'; S.t0 = now; }
    } else if (S.fase === 'dio') {
      e = 1; ePudar = 1; eWarna = 1;
      bob = rm ? 0 : pxKeY(5, dio.cam) * 0.5 * (1 - Math.cos(el / 6000 * Math.PI * 2));
    } else {
      e = rm ? 0 : 1 - inOut(clamp((el - 200) / 750));
      ePudar = rm ? 0 : 1 - clamp((el - 900) / 300);
      eWarna = rm ? 0 : 1 - clamp((el - 550) / 350);
      PROV.forEach((q) => { if (q !== pr) petaPosisi(q, now, dt); });
      if (rm || el >= DUR.kembali) selesaiKembali();
    }
    if (dio) {
      const k = campurKam(CAM_PETA, dio.cam, e);
      aturKamera(k);
      aturMatahari(lerp(pusatPeta[0], dio.cam.Tx, e), lerp(pusatPeta[1], dio.cam.Tz, e));
      lainPudar(pr.nama, 1 - ePudar);
      warnaPulau(pr, eWarna);
      pulauDiorama(pr, e, bob);
      dio.grup.position.y = Y_DIO + bob;
      updateAdegan(now, dt);
    }
  }
  if (labelNodes) updateLabel(tampilLabel);
  kepulan.mulai();
  if (dio) { scene.updateMatrixWorld(); dio.adegan.forEach((sc) => sc.isi.visible && sc.kepul(kepulan)); }
  kepulan.selesai();
  renderer.render(scene, cam);
  if (dio && S.fase === 'dio') posBalon(now);
}
function selesaiKembali() {
  const pr = dio.pr;
  buangDiorama();
  PROV.forEach((q) => {
    q.mAtas.opacity = q.mSisi.opacity = q.mGaris.opacity = 1;
    q.mAtas.transparent = q.mSisi.transparent = q.mGaris.transparent = false;
    q.mAtas.needsUpdate = q.mSisi.needsUpdate = true;
    q.grup.visible = true; q.mesh.castShadow = true;
  });
  warnaProv(pr, true);
  pr.mesh.position.y = 0;
  S.fase = 'peta';
  $('#dio').hidden = true;
  $('#dio').classList.remove('keluar');
  $('#peta').classList.remove('redup-ui');
  renderTop5(); renderKartu();
}

function updateAdegan(now, dt) {
  const rm = diam();
  dio.adegan.forEach((sc) => {
    // lahir dari tanah (easeOutBack), susut saat pulang, lompat saat ganti lensa
    let s = 1, y = 0;
    if (sc.susut) { const p = rm ? 1 : clamp((now - sc.susut) / 250); s = 1 - p * p; }
    else {
      const p = rm ? 1 : clamp((now - sc.lahir) / 750);
      s = p <= 0 ? 0 : 0.1 + 0.9 * keluarBalik(p);
      y = -18 * (1 - Math.min(1, s));
      if (sc.lompat && !rm) { const q = clamp((now - sc.lompat) / 500); if (q > 0 && q < 1) y += 10 * Math.sin(Math.PI * q); }
    }
    sc.isi.visible = s > 0.002;
    sc.isi.scale.set(Math.max(0.002, s), Math.max(0.002, s), Math.max(0.002, s));
    sc.isi.position.y = y;
    if (!rm) {
      sc.laju = lerp(sc.laju, sc.lajuTarget, 1 - Math.exp(-dt * 3));
      sc.waktu += dt * sc.laju;
    }
    sc.update(sc.waktu, rm ? 0 : dt * sc.laju);
  });
}

const balon = $('#balon');
function posBalon(now) {
  const sc = dio.balonSc;
  if (!sc || now < dio.balonMulai) { balon.hidden = true; return; }
  const p = new THREE.Vector3(0, sc.tinggi + 10, 0);
  sc.root.localToWorld(p);
  const [x, y] = keLayar(p.x, p.y, p.z);
  balon.hidden = false;
  balon.style.left = clamp(x, 180, 850).toFixed(1) + 'px';
  balon.style.top = Math.max(x < 470 ? 330 : 250, y).toFixed(1) + 'px'; // jangan menutupi judul kiri-atas
}

// ================= INTERAKSI =================
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function titikPanggung(ev) {
  const r = panggung.getBoundingClientRect();
  return [(ev.clientX - r.left) / skalaPanggung, (ev.clientY - r.top) / skalaPanggung];
}
function kena(ev) {
  const [x, y] = titikPanggung(ev);
  ndc.set(x / W * 2 - 1, -(y / H) * 2 + 1);
  ray.setFromCamera(ndc, cam);
  if (S.fase === 'peta') {
    const h = ray.intersectObjects(PROV.map((p) => p.mesh), false)[0];
    return h ? h.object.userData.prov : null;
  }
  if (S.fase === 'dio') {
    const h = ray.intersectObjects(dio.grup.children, true).find((i) => i.object.userData.kode);
    return h ? h.object.userData.kode : null;
  }
  return null;
}
const kanvas = $('#kanvas');
kanvas.addEventListener('pointermove', (ev) => {
  if (!S.data) return;
  const k = kena(ev);
  kanvas.style.cursor = k ? 'pointer' : '';
  if (S.fase === 'peta') {
    const n = k ? k.nama : null;
    if (n !== S.hover) { S.hover = n; renderKartu(); }
  }
});
kanvas.addEventListener('pointerleave', () => { if (S.fase === 'peta' && S.hover) { S.hover = null; renderKartu(); } });
kanvas.addEventListener('click', (ev) => {
  if (!S.data) return;
  const k = kena(ev);
  if (S.fase === 'peta' && k) masuk(k.nama);
  else if (S.fase === 'dio' && k) pilihSektor(k);
});
$('#top5').addEventListener('click', (ev) => { const b = ev.target.closest('[data-prov]'); if (b) pilihProv(b.dataset.prov); });
$('#terpilih').addEventListener('click', (ev) => { if (ev.target.closest('#tbl-masuk')) masuk(S.pilih); });
$('#tbl-peta').addEventListener('click', kembali);
$('#lensa').addEventListener('click', (ev) => { const b = ev.target.closest('[data-lensa]'); if (b) gantiLensa(b.dataset.lensa); });
$('#daftar').addEventListener('click', (ev) => { const b = ev.target.closest('[data-kode]'); if (b) pilihSektor(b.dataset.kode); });
addEventListener('keydown', (ev) => { if (ev.key === 'Escape') kembali(); });

// ================= MULAI =================
fetch('data.json').then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
  S.data = d;
  bangunPeta(d);
  warnaProv(provBy(S.pilih), true);
  siapLabel(); renderTop5(); renderKartu();
  panggung.classList.remove('memuat');
  S.fase = 'peta'; S.mulaiPeta = performance.now();
  const h = decodeURIComponent(location.hash.slice(1));
  if (h && provBy(h)) { S.mulaiPeta -= 5000; requestAnimationFrame(() => masuk(h)); }
  setTimeout(() => { // ikon daftar sektor: render kecil tiap adegan sekali
    try { ikonURL = buatIkon(d.sektor.map((s) => s.ikon)); if (dio) renderDioUI(); } catch (e) { console.warn('ikon gagal', e); }
  }, 400);
}).catch((e) => { $('#pesan').textContent = 'Data gagal dimuat (' + e.message + '). Jalankan lewat server statis, mis. python3 -m http.server.'; });
requestAnimationFrame(frame);
window.__pdrb = { S, PROV: () => PROV, cam, THREE, kepulan, dio: () => dio, masuk, kembali, gantiLensa, pilihSektor, renderer }; // untuk uji otomatis
