// 17 adegan sektor isometrik (Three.js). Satuan desain: petak berjari-jari 60, permukaan petak di y = 0.
// Tiap adegan = 1 mesh statis gabungan + beberapa bagian bergerak (masing-masing 1 mesh), semua memakai
// satu material Lambert ber-vertex-color per adegan. Warna lensa ditulis ulang ke vertex (peran: atap, aksen, ...).
import * as THREE from 'three';

const { Vector3, Matrix4, Quaternion, Euler, Color, BufferGeometry, Float32BufferAttribute } = THREE;
const BG = new Color('#FCFCFB');
const NETRAL = {
  dinding: '#F7F7F6', dinding2: '#D6D6D5', kaca: '#6B6B6A', kaca2: '#4B4B4A', logam: '#E2E2E1', logam2: '#B5B5B4',
  putih: '#FFFFFF', air: '#D4D4D3', air2: '#A7A7A6', roda: '#2A2A2A', batang: '#7D7D7C', jalan: '#E2E1DE',
  kulit: '#E8B9A0', gelap: '#4B4B4A', lampu: '#F2D27A', petak: '#F7F7F6', petakSisi: '#D6D6D5', laut: '#C9C9C8', marka: '#FFFFFF',
};
const PERAN = { atap: 0, atap2: 1, aksen: 2, aksen2: 3, daun: 4, daun2: 5, tanah: 6, tanah2: 7 };
const hex = (a) => a.map((h) => new Color(h));
export const KELAS = {
  '': hex(['#B5B5B4', '#888887', '#9A9A99', '#C3C3C2', '#B5B5B4', '#8C8C8B', '#D4D4D3', '#B5B5B4']),
  sorot: hex(['#E4572E', '#C2441F', '#E4572E', '#F2A48A', '#EE8A6B', '#C2441F', '#F2B9A5', '#E08A6C']),
  c0: hex(['#E9E9E8', '#D4D4D3', '#D4D4D3', '#E9E9E8', '#DCDCDB', '#C8C8C7', '#ECECEB', '#D9D9D8']),
  c1: hex(['#B5B5B4', '#9A9A99', '#A7A7A6', '#C3C3C2', '#AFAFAE', '#959594', '#C8C8C7', '#ADADAC']),
  c2: hex(['#7D7D7C', '#626261', '#717170', '#969695', '#7D7D7C', '#626261', '#969695', '#7D7D7C']),
  c3: hex(['#3E3E3D', '#2A2A29', '#4B4B4A', '#626261', '#4B4B4A', '#333332', '#626261', '#4B4B4A']),
};
KELAS.cn = KELAS.sorot;
const NETRAL_C = Object.fromEntries(Object.entries(NETRAL).map(([k, v]) => [k, new Color(v)]));
function warnaDari(w) {
  if (w in PERAN) return [PERAN[w], KELAS[''][PERAN[w]]];
  return [-1, NETRAL_C[w] || new Color(w)];
}

// ---------- perakit geometri ----------
const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(), _p = new Vector3(), _s = new Vector3();
const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
const G = {
  kotak: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  kotakX: new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0),
  pelana: (() => {
    const A = [-0.5, 0, -0.5], B = [0.5, 0, -0.5], C = [0.5, 0, 0.5], D = [-0.5, 0, 0.5], E = [-0.5, 1, 0], F = [0.5, 1, 0];
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute([D, C, F, D, F, E, B, A, E, B, E, F, A, D, E, C, B, F].flat(), 3));
    g.computeVertexNormals();
    return g;
  })(),
};
export class Rakit {
  constructor() { this.bag = []; }
  geo(g, warna, m) {
    let h = g.index ? g.toNonIndexed() : g.clone();
    if (m) h.applyMatrix4(m);
    this.bag.push([h, warna]);
    return this;
  }
  kotak(x, y, z, w, hh, d, warna, ry = 0, rx = 0, rz = 0) { return this.geo(G.kotak, warna, M(x, y, z, rx, ry, rz, w, hh, d)); }
  kotakX(x, y, z, len, hh, d, warna, ry = 0, rz = 0) { return this.geo(G.kotakX, warna, M(x, y, z, 0, ry, rz, len, hh, d)); }
  tabung(x, y, z, r, hh, warna, n = 12, rTop = r) { return this.geo(new THREE.CylinderGeometry(rTop, r, hh, n).translate(0, hh / 2, 0), warna, M(x, y, z)); }
  kerucut(x, y, z, r, hh, warna, n = 8) { return this.tabung(x, y, z, r, hh, warna, n, 0); }
  bola(x, y, z, r, warna, sy = 1, n = 8) { return this.geo(new THREE.SphereGeometry(1, n, Math.max(4, Math.round(n * 0.7))), warna, M(x, y, z, 0, 0, 0, r, r * sy, r)); }
  roda(x, y, z, r, w, warna = 'roda', ry = 0) { return this.geo(new THREE.CylinderGeometry(r, r, w, 10).rotateX(Math.PI / 2), warna, M(x, y, z, 0, ry, 0)); }
  pelana(x, y, z, w, hh, d, warna, ry = 0) { return this.geo(G.pelana, warna, M(x, y, z, 0, ry, 0, w, hh, d)); }
  piring(x, y, z, r0, r1, warna, n = 32) { return this.geo(new THREE.RingGeometry(r0, r1, n).rotateX(-Math.PI / 2), warna, M(x, y, z)); }
  cincin(x, y, z, R, tube, warna, rx = 0, ry = 0) { return this.geo(new THREE.TorusGeometry(R, tube, 5, 28), warna, M(x, y, z, rx, ry, 0)); }
  batang(a, b, r, warna, n = 4) {
    const va = new Vector3(...a), vb = new Vector3(...b), dir = vb.clone().sub(va), L = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
    return this.geo(new THREE.CylinderGeometry(r, r, L, n).translate(0, L / 2, 0), warna, new Matrix4().compose(va, q, new Vector3(1, 1, 1)));
  }
  bangun(bahan) {
    let n = 0;
    this.bag.forEach(([g]) => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), peran = new Int8Array(n);
    let o = 0;
    this.bag.forEach(([g, w]) => {
      const c = g.attributes.position.count, [pi, cc] = warnaDari(w);
      if (!g.attributes.normal) g.computeVertexNormals();
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < c; i++) { col[(o + i) * 3] = cc.r; col[(o + i) * 3 + 1] = cc.g; col[(o + i) * 3 + 2] = cc.b; peran[o + i] = pi; }
      o += c;
      g.dispose();
    });
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new Float32BufferAttribute(col, 3));
    geo.userData = { peran, asli: col.slice() };
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, bahan);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
}

// ---------- warna lensa ----------
const _c = new Color();
export function warnai(sc, kelas, redup) {
  const pal = KELAS[kelas] || KELAS[''], f = redup ? 0.72 : 0;
  sc.meshes.forEach((m) => {
    const g = m.geometry, a = g.attributes.color, { peran, asli } = g.userData;
    for (let i = 0; i < peran.length; i++) {
      if (peran[i] >= 0) _c.copy(pal[peran[i]]); else _c.setRGB(asli[i * 3], asli[i * 3 + 1], asli[i * 3 + 2]);
      if (f) _c.lerp(BG, f);
      a.array[i * 3] = _c.r; a.array[i * 3 + 1] = _c.g; a.array[i * 3 + 2] = _c.b;
    }
    a.needsUpdate = true;
  });
  sc.khusus.forEach(({ mat, peran }) => { mat.color.copy(pal[PERAN[peran]]); if (f) mat.color.lerp(BG, f); });
}

// ---------- partikel asap / debu / uap / percikan (satu InstancedMesh untuk semua) ----------
export class Kepulan {
  constructor(maks) {
    this.maks = maks;
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), maks);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    for (let i = 0; i < maks; i++) this.mesh.setColorAt(i, BG);
    this.n = 0;
    this.m = new Matrix4(); this.q = new Quaternion(); this.v = new Vector3(); this.s = new Vector3();
  }
  mulai() { this.n = 0; }
  tambah(x, y, z, r, warna) {
    if (this.n >= this.maks || r <= 0.01) return;
    this.m.compose(this.v.set(x, y, z), this.q, this.s.set(r, r, r));
    this.mesh.setMatrixAt(this.n, this.m);
    this.mesh.setColorAt(this.n, warna);
    this.n++;
  }
  selesai() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

// ---------- utilitas gerak ----------
const fr = (x) => x - Math.floor(x);
const mulus = (x) => x * x * (3 - 2 * x);
const pingpong = (t, per, fase = 0) => { const u = fr(t / per + fase); return u < 0.5 ? mulus(u * 2) : mulus(2 - u * 2); };
const maju = (t, per, fase = 0) => fr(t / per + fase) < 0.5;
function kf(u, keys) { // keyframe dengan smoothstep: keys = [[u, nilai], ...] u naik 0..1
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (u <= keys[i][0]) { const [u0, a] = keys[i - 1], [u1, b] = keys[i]; return a + (b - a) * mulus((u - u0) / (u1 - u0 || 1)); }
  }
  return keys[keys.length - 1][1];
}
function bolak(o, ax, az, bx, bz, t, per, fase = 0) { // bolak-balik, berbalik arah di ujung
  const p = pingpong(t, per, fase), d = maju(t, per, fase) ? 1 : -1;
  o.position.x = ax + (bx - ax) * p; o.position.z = az + (bz - az) * p;
  o.rotation.y = Math.atan2(-(bz - az) * d, (bx - ax) * d);
}
function lintas(o, ax, az, bx, bz, t, per, fase = 0) { // satu arah, muncul/hilang di ujung
  const u = fr(t / per + fase);
  o.position.x = ax + (bx - ax) * u; o.position.z = az + (bz - az) * u;
  o.rotation.y = Math.atan2(-(bz - az), bx - ax);
  o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.08, (1 - u) / 0.08)));
}
const kedip = (o, t, per, fase = 0) => { o.visible = fr(t / per + fase) < 0.5; };

const chord = (z, w) => 2 * Math.sqrt(Math.max(0, 57 * 57 - (Math.abs(z) + w / 2) ** 2));
// ---------- komponen ----------
function pohon(R, x, z, s = 1) {
  R.tabung(x, 0, z, 0.9 * s, 7 * s, 'batang', 6);
  R.bola(x, 10 * s, z, 5 * s, 'daun2', 1.05, 8);
  R.bola(x - 1.4 * s, 12.6 * s, z + 1.2 * s, 3.4 * s, 'daun', 1, 7);
}
function orang(R, baju = 'aksen', s = 1, topi = null) {
  R.kotak(-0.45 * s, 0, 0, 0.6 * s, 2.6 * s, 0.7 * s, 'gelap'); R.kotak(0.45 * s, 0, 0, 0.6 * s, 2.6 * s, 0.7 * s, 'gelap');
  R.tabung(0, 2.4 * s, 0, 1.15 * s, 3.2 * s, baju, 6, 0.9 * s);
  R.bola(0, 6.6 * s, 0, 1.15 * s, 'kulit', 1, 6);
  if (topi === 'caping') R.kerucut(0, 7.1 * s, 0, 2.6 * s, 1.4 * s, 'tanah', 8);
  if (topi === 'helm') R.bola(0, 6.9 * s, 0, 1.3 * s, 'lampu', 0.7, 6);
}
function mobil(R, warna = 'aksen', panjang = 10) {
  R.kotak(0, 1.1, 0, panjang, 2.8, 5, warna);
  R.kotak(-0.6, 3.9, 0, panjang * 0.55, 2.3, 4.6, 'kaca');
  R.kotak(-0.6, 6.1, 0, panjang * 0.57, 0.4, 4.8, warna);
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => R.roda(sx * panjang * 0.32, 1.3, sz * 2.5, 1.3, 1)));
}
function kabinTruk(R, warna = 'aksen') {
  R.kotak(5, 1.2, 0, 5, 6, 6, warna);
  R.kotak(6.4, 4.2, 0, 2.4, 2.4, 6.1, 'kaca');
  R.kotak(-1, 1, 0, 14, 1.2, 5.6, 'gelap');
  [[5, 0], [-2.5, 0], [-5.5, 0]].forEach(([x]) => [-1, 1].forEach((sz) => R.roda(x, 1.6, sz * 2.9, 1.6, 1.2)));
}

// ---------- adegan ----------
const ADEGAN = {
  // Pertanian: sawit bergoyang, sawah, traktor bolak-balik, petani bercaping, burung, sampan di kolam
  sawit(c) {
    const S = c.S;
    S.kotak(-12, 0, 14, 48, 0.8, 30, 'tanah');
    for (let i = 0; i < 6; i++) S.kotak(-12, 0.8, 2 + i * 5, 44, 1.6, 2.2, 'daun');
    const palm = [];
    [[-34, -20, 1], [-14, -30, 1.1], [6, -24, 0.95], [26, -12, 1.05], [-30, -38 + 12, 0.85]].forEach(([x, z, s], i) => {
      S.tabung(x, 0, z, 1.5 * s, 24 * s, 'batang', 6, 1.2 * s);
      S.bola(x, 22.5 * s, z + 0.8, 2 * s, 'aksen', 0.9, 6);
      const p = c.gerak((R) => {
        for (let k = 0; k < 8; k++) R.kotakX(0, 0, 0, 12 * s, 0.6, 2.8 * s, k % 2 ? 'daun' : 'daun2', k * Math.PI / 4 + 0.3 * i, -0.38 - 0.12 * (k % 2));
        R.bola(0, 0.5, 0, 2.2 * s, 'daun2', 1, 6);
      });
      p.position.set(x, 24 * s, z); p.userData.f = i * 1.7;
      palm.push(p);
    });
    const kolam = c.air(18, 14, 34, 0.5, 20, 4, 3);
    S.kotak(34, 0, 20, 20, 0.6, 16, 'tanah2');
    void kolam;
    const sampan = c.gerak((R) => { R.kotak(0, 0, 0, 8, 1.4, 2.6, 'aksen2'); R.kotak(0, 1.2, 0, 7, 0.3, 2, 'batang'); orang(R, 'aksen', 0.6, 'caping'); });
    const traktor = c.gerak((R) => {
      R.kotak(1.5, 2.2, 0, 7, 3, 4, 'aksen'); R.kotak(-2.5, 2.2, 0, 4, 6.5, 4.2, 'aksen');
      R.kotak(-2.5, 5, 0, 3.4, 3.4, 3.6, 'kaca'); R.kotak(-2.5, 8.6, 0, 4.4, 0.4, 4.6, 'aksen2');
      R.tabung(3.6, 5, -1, 0.35, 3, 'gelap', 5);
      R.roda(-2.6, 3, -2.6, 3, 1.4); R.roda(-2.6, 3, 2.6, 3, 1.4); R.roda(3.4, 1.6, -2.3, 1.6, 1); R.roda(3.4, 1.6, 2.3, 1.6, 1);
      R.kotak(-7, 0.8, 0, 3, 1.2, 7, 'logam2');
    });
    traktor.position.y = 0.8;
    const petani = c.gerak((R) => orang(R, 'aksen2', 0.9, 'caping'));
    const burung = c.gerak((R) => { R.bola(0, 0, 0, 0.9, 'gelap', 0.8, 5); });
    const sayap = [-1, 1].map((sd) => c.gerak((R) => R.kotakX(0, 0, 0, 3.2, 0.2, 1.4, 'gelap', sd > 0 ? 0 : Math.PI), burung));
    const asap = c.titik(traktor, [3.6, 8.4, -1]);
    c.kepul(asap, { warna: '#9A9A99', per: 1.6, n: 5, naik: 10, geser: -4, r: 1.5 });
    return {
      tinggi: 34,
      gerak(t) {
        palm.forEach((p) => { p.rotation.z = 0.06 * Math.sin(t * 1.3 + p.userData.f); p.rotation.x = 0.05 * Math.sin(t * 1.1 + p.userData.f * 2); });
        bolak(traktor, -30, 9, 4, 9, t, 9);
        bolak(petani, -28, 22, -2, 24, t, 11, 0.3);
        petani.position.y = 0.8 + Math.abs(Math.sin(t * 7)) * 0.4;
        sampan.position.set(30 + Math.sin(t * 0.5) * 3, 0.9 + Math.sin(t * 2.2) * 0.35, 20 + Math.cos(t * 0.4) * 2);
        sampan.rotation.set(Math.sin(t * 1.8) * 0.06, Math.sin(t * 0.3) * 0.5, Math.sin(t * 2.2) * 0.05);
        const u = fr(t / 9);
        burung.position.set(-60 + 120 * u, 44 + Math.sin(t * 2) * 2, -10 + 10 * u);
        burung.rotation.y = -0.08;
        burung.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.08, (1 - u) / 0.08)));
        sayap[0].rotation.x = Math.sin(t * 12) * 0.7; sayap[1].rotation.x = -Math.sin(t * 12) * 0.7;
      },
    };
  },

  // Pertambangan: lubang tambang berundak, ekskavator mengeruk & berputar, dump truck mundur ke timbunan lalu menuang
  tambang(c) {
    const S = c.S, px = -16, pz = -10;
    const prof = [[0, 0.6], [9, 0.6], [12, 2.2], [14.5, 2.2], [17.5, 4.6], [20, 4.6], [23, 7], [25.5, 7], [27, 8.2], [33, 0]];
    S.geo(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 30), 'tanah2', M(px, 0, pz));
    [[9, 12, 2.25], [14.5, 17.5, 4.65], [20, 23, 7.05]].forEach(([a, b, y]) => S.piring(px, y, pz, a, b, 'tanah', 30));
    S.piring(px, 0.65, pz, 0, 8, 'gelap', 20);
    S.kotak(16, 0, 18, 50, 0.4, 8, 'jalan');
    S.kerucut(40, 0, 22, 9, 8, 'tanah2', 10); S.kerucut(38, 0, 26, 6, 5, 'tanah', 9);
    // ekskavator
    const eks = c.gerak((R) => { R.kotak(0, 0, -3, 11, 2.6, 2.6, 'gelap'); R.kotak(0, 0, 3, 11, 2.6, 2.6, 'gelap'); R.kotak(0, 2.4, 0, 6, 1, 5, 'logam2'); });
    eks.position.set(10, 0, -4);
    const atas = c.gerak((R) => {
      R.kotak(-0.5, 0, 0, 8, 3.4, 6, 'aksen'); R.kotak(-4.2, 0, 0, 2.2, 3, 6, 'gelap');
      R.kotak(1.6, 3.4, 1.4, 3.2, 3.6, 2.8, 'kaca'); R.kotak(1.6, 7, 1.4, 3.4, 0.4, 3, 'aksen2');
    }, eks);
    atas.position.y = 3.4;
    const lampu = c.gerak((R) => R.bola(0, 0, 0, 0.6, 'lampu', 1, 6), atas); lampu.position.set(1.6, 7.8, 1.4);
    const boom = c.gerak((R) => { R.kotakX(0, 0, 0, 13, 1.6, 1.6, 'aksen'); }, atas); boom.position.set(2.8, 2, -1);
    const lengan = c.gerak((R) => { R.kotakX(0, 0, 0, 9, 1.2, 1.2, 'aksen2'); }, boom); lengan.position.x = 13;
    const ember = c.gerak((R) => { R.kotak(0, -1.8, 0, 2.8, 2.6, 2.6, 'gelap'); R.kotak(1.2, -2.4, 0, 0.8, 0.8, 2.8, 'logam2'); }, lengan); ember.position.x = 9;
    const debu = c.titik(ember, [0, -1, 0]);
    // dump truck (mundur ke timbunan, menuang, maju lagi)
    const truk = c.gerak((R) => kabinTruk(R, 'aksen'));
    truk.position.set(4, 0, 18); truk.rotation.y = Math.PI;
    const bak = c.gerak((R) => { R.kotak(4.5, 0, 0, 9, 4, 6.2, 'aksen2'); R.kotak(4.5, 0.6, 0, 8, 3.6, 5.2, 'gelap'); }, truk);
    bak.position.set(-8, 2.4, 0);
    const muatan = c.gerak((R) => R.bola(0, 0, 0, 3.6, 'tanah', 0.55, 8), bak); muatan.position.set(4.5, 3.6, 0);
    c.kepul(debu, { warna: '#CFC8BE', per: 1.4, n: 6, naik: 9, geser: 3, r: 2.8, aktif: () => c.st.debu });
    const debuTuang = c.titik(truk, [-11, 3, 0]);
    c.kepul(debuTuang, { warna: '#CFC8BE', per: 1.2, n: 6, naik: 8, geser: 4, r: 3.4, aktif: () => c.st.tuang });
    return {
      tinggi: 26,
      gerak(t) {
        const u = fr(t / 6);
        atas.rotation.y = kf(u, [[0, Math.PI], [0.28, Math.PI], [0.5, Math.PI + 1.46], [0.66, Math.PI + 1.46], [0.88, Math.PI]]);
        boom.rotation.z = kf(u, [[0, 0.35], [0.12, -0.32], [0.3, -0.18], [0.45, 0.5], [0.66, 0.42], [0.9, 0.35]]);
        lengan.rotation.z = kf(u, [[0, -1.1], [0.12, -1.6], [0.3, -2.2], [0.45, -1.4], [0.55, -0.7], [0.7, -0.9], [0.9, -1.1]]);
        ember.rotation.z = kf(u, [[0, -0.3], [0.3, -1.4], [0.5, -1.4], [0.6, 0.6], [0.75, -0.3]]);
        c.st.debu = (u > 0.14 && u < 0.3) || (u > 0.55 && u < 0.66);
        lampu.visible = fr(t / 0.8) < 0.5;
        const v = fr(t / 12);
        truk.position.x = kf(v, [[0, 4], [0.42, 4], [0.6, 30], [0.86, 30], [1, 4]]);
        bak.rotation.z = kf(v, [[0.6, 0], [0.68, 0.75], [0.8, 0.75], [0.86, 0]]);
        muatan.scale.setScalar(Math.max(0.001, kf(v, [[0, 0.3], [0.2, 0.65], [0.4, 1], [0.66, 1], [0.76, 0.001], [0.99, 0.001], [1, 0.3]])));
        c.st.tuang = v > 0.66 && v < 0.8;
      },
    };
  },

  // Industri: pabrik atap gergaji, dua cerobong berasap, silo, konveyor berjalan, forklift, lampu berkedip
  pabrik(c) {
    const S = c.S;
    S.kotak(-6, 0, -6, 36, 13, 24, 'dinding');
    S.kotak(-6, 0, 6.1, 36, 13, 0.2, 'dinding2');
    for (let i = 0; i < 3; i++) { S.pelana(-6, 13, -14 + i * 8, 36, 4.5, 8, 'atap'); S.kotak(-6, 13, -10.2 + i * 8, 36, 4.2, 0.4, 'kaca'); }
    for (let i = 0; i < 5; i++) S.kotak(-20 + i * 7, 4, 6.3, 4.4, 3.4, 0.3, 'kaca');
    S.kotak(10, 0, 6.3, 6, 8, 0.4, 'aksen2');
    [[-18, -20, 40], [-9, -22, 34]].forEach(([x, z, h]) => {
      S.tabung(x, 0, z, 2.8, h, 'putih', 12, 2.2);
      S.tabung(x, h - 8, z, 2.6, 2.4, 'aksen', 12); S.tabung(x, h - 14, z, 2.75, 2.4, 'aksen', 12);
    });
    [[26, -14], [26, -2]].forEach(([x, z]) => { S.tabung(x, 0, z, 5.5, 18, 'logam', 14); S.kerucut(x, 18, z, 5.6, 3.5, 'logam2', 14); S.kotak(x - 4, 0, z, 1, 22, 1, 'batang'); });
    S.kotak(17, 7.5, -8, 14, 1, 3, 'logam2'); S.kotak(12, 0, -8, 1, 7.5, 1, 'batang'); S.kotak(22, 0, -8, 1, 7.5, 1, 'batang');
    S.kotak(-32, 0, 20, 8, 1.2, 8, 'logam2'); S.kotak(-32, 1.2, 20, 6, 4, 6, 'tanah'); S.kotak(-24, 0, 24, 6, 4, 6, 'tanah2');
    S.kotak(0, 0, 18, 70, 0.3, 9, 'jalan');
    const kotakK = [0, 1, 2, 3].map(() => c.gerak((R) => R.kotak(0, 0, 0, 2.4, 2, 2.2, 'tanah')));
    const asap1 = c.titik(null, [-18, 41, -20]), asap2 = c.titik(null, [-9, 35, -22]);
    c.kepul(asap1, { per: 3.4, n: 11, naik: 34, geser: 10, r: 5.2 });
    c.kepul(asap2, { per: 3.8, n: 11, naik: 30, geser: 10, r: 4.6, fase: 0.4 });
    const lampu = [[-18, 40.6, -20], [-9, 34.6, -22]].map((p) => { const o = c.gerak((R) => R.bola(0, 0, 0, 0.9, 'aksen', 1, 6)); o.position.set(...p); return o; });
    const fork = c.gerak((R) => {
      R.kotak(0, 0.8, 0, 5, 2.4, 3.4, 'aksen'); R.kotak(-0.8, 3.2, 0, 2.6, 2.6, 3, 'kaca'); R.kotak(-0.8, 5.8, 0, 3, 0.3, 3.4, 'aksen2');
      R.kotak(2.9, 0, 0, 0.4, 7, 2.6, 'gelap'); R.kotak(4.4, 1, 0, 3, 0.3, 2.6, 'logam2'); R.kotak(4.4, 1.3, 0, 2.8, 2.4, 2.6, 'tanah');
      R.roda(-1.6, 1, -1.8, 1, 0.8); R.roda(-1.6, 1, 1.8, 1, 0.8); R.roda(1.6, 1, -1.8, 1, 0.8); R.roda(1.6, 1, 1.8, 1, 0.8);
    });
    const truk = c.gerak((R) => { kabinTruk(R, 'aksen2'); R.kotak(-2, 2.2, 0, 10, 6, 6, 'dinding2'); });
    return {
      tinggi: 42,
      gerak(t) {
        kotakK.forEach((o, i) => { const u = fr(t / 4 + i / 4); o.position.set(11 + 13 * u, 8.5, -8); o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.1, (1 - u) / 0.1))); });
        kedip(lampu[0], t, 1.6); kedip(lampu[1], t, 1.6, 0.5);
        bolak(fork, -14, 13, 6, 13, t, 7);
        lintas(truk, -54, 22, 54, 22, t, 8, 0.2);
      },
    };
  },

  // Listrik & gas: dua kincir angin berputar, menara pendingin beruap, sutet dengan arus mengalir, mobil servis
  listrik(c) {
    const S = c.S;
    const rotor = [];
    [[-28, -14, 1], [-8, -30, 0.9]].forEach(([x, z, s], i) => {
      S.tabung(x, 0, z, 1.8 * s, 44 * s, 'putih', 10, 0.8 * s);
      S.kotak(x, 43 * s, z - 1, 2.6 * s, 2.6 * s, 6 * s, 'logam');
      const r = c.gerak((R) => {
        R.bola(0, 0, 0, 1.3 * s, 'aksen', 1, 8);
        for (let k = 0; k < 3; k++) R.kotakX(0, 0, 0.4, 19 * s, 2.2 * s, 0.5, 'putih', 0, k * Math.PI * 2 / 3);
      });
      r.position.set(x, 44.3 * s, z + 2.3 * s); r.userData.f = i * 1.3;
      rotor.push(r);
    });
    const prof = [[10, 0], [8.4, 7], [6.9, 15], [7, 20], [7.8, 24]];
    S.geo(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24), 'logam', M(20, 0, -14));
    S.piring(20, 23.6, -14, 0, 7.6, 'gelap', 20);
    S.kotak(24, 0, 12, 18, 8, 12, 'dinding2'); S.kotak(24, 8, 12, 18, 0.8, 12, 'atap');
    for (let i = 0; i < 3; i++) S.tabung(18 + i * 6, 8.8, 12, 1.2, 3, 'logam2', 8);
    // tiang sutet
    const tx = 0, tz = 8, th = 30;
    [[-3, -3], [3, -3], [3, 3], [-3, 3]].forEach(([a, b]) => S.batang([tx + a, 0, tz + b], [tx + a * 0.25, th, tz + b * 0.25], 0.35, 'garisT'));
    [8, 16, 24].forEach((y) => { const k = 3 * (1 - y / th * 0.75); S.kotak(tx, y, tz, 2 * k + 0.6, 0.4, 2 * k + 0.6, 'batang'); });
    S.kotak(tx, 22, tz, 14, 0.6, 0.8, 'batang'); S.kotak(tx, 27, tz, 10, 0.6, 0.8, 'batang');
    const kabel = [[[tx + 7, 22, tz], [24, 10, 6]], [[tx - 7, 22, tz], [-28, 6, 6]]];
    kabel.forEach(([a, b]) => S.batang(a, b, 0.18, 'gelap', 3));
    const arus = [];
    kabel.forEach(([a, b]) => { for (let i = 0; i < 3; i++) arus.push({ o: c.gerak((R) => R.bola(0, 0, 0, 0.9, 'lampu', 1, 6)), a, b, f: i / 3 }); });
    const lampu = c.gerak((R) => R.bola(0, 0, 0, 0.8, 'aksen', 1, 6)); lampu.position.set(tx, th + 0.6, tz);
    const uap = c.titik(null, [20, 24, -14]);
    c.kepul(uap, { warna: '#EDECEA', per: 4.2, n: 11, naik: 30, geser: 6, r: 7 });
    const van = c.gerak((R) => { mobil(R, 'aksen', 9); R.kotak(-0.6, 6.5, 0, 4, 0.6, 1, 'lampu'); });
    return {
      tinggi: 56,
      gerak(t) {
        rotor.forEach((r) => { r.rotation.z = -t * 1.7 - r.userData.f; });
        arus.forEach(({ o, a, b, f }) => {
          const u = fr(t / 2.4 + f);
          o.position.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
          o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.15, (1 - u) / 0.2)));
        });
        kedip(lampu, t, 1.6);
        lintas(van, 40, -34, 40, 34, t, 7);
      },
    };
  },

  // Air, sampah & daur ulang: menara air meneteskan air ke kolam, bak pengolah dengan lengan berputar, truk sampah, tong daur ulang
  air(c) {
    const S = c.S;
    const wx = -24, wz = -18;
    [[-4, -4], [4, -4], [4, 4], [-4, 4]].forEach(([a, b]) => S.batang([wx + a * 1.3, 0, wz + b * 1.3], [wx + a, 24, wz + b], 0.5, 'batang', 5));
    S.kotak(wx, 12, wz, 9, 0.5, 9, 'batang');
    S.tabung(wx, 24, wz, 7.5, 9, 'aksen', 16); S.kerucut(wx, 33, wz, 7.8, 4, 'atap', 16);
    S.batang([wx + 4, 26, wz + 4], [-15, 13, -6], 0.7, 'logam2', 6);
    c.air(16, 12, -14, 0.4, 2, 4, 3);
    S.kotak(-14, 0, 2, 18, 0.5, 14, 'logam2');
    // bak pengolah bundar
    S.tabung(16, 0, -8, 15, 4, 'logam2', 28); S.tabung(16, 0, -8, 13.6, 3.7, 'air2', 28);
    S.tabung(16, 0, -8, 1.4, 6, 'logam', 8);
    const lengan = c.gerak((R) => { R.kotak(0, 0, 0, 28, 1, 2, 'logam'); R.kotak(13, 1, 0, 1.6, 2.4, 2.4, 'aksen'); R.kotak(0, -2.6, 0, 26, 2.6, 0.3, 'logam2'); });
    lengan.position.set(16, 5.4, -8);
    const tetes = [0, 1, 2].map((i) => ({ o: c.gerak((R) => R.bola(0, 0, 0, 0.7, 'air2', 1.4, 6)), f: i / 3 }));
    [['aksen', 24], ['aksen2', 30], ['atap', 36]].forEach(([w, x]) => { S.kotak(x, 0, 24, 5, 6, 5, w); S.kotak(x, 6, 24, 5.4, 0.8, 5.4, 'gelap'); });
    const truk = c.gerak((R) => { kabinTruk(R, 'aksen'); R.kotak(-2, 2.2, 0, 10, 6.5, 6, 'aksen2'); R.kotak(-7.2, 2.6, 0, 0.6, 5.6, 5.4, 'gelap'); });
    const pohonG = c.gerak((R) => pohon(R, 0, 0, 1.2)); pohonG.position.set(-38, 0, 16);
    const p2 = c.gerak((R) => pohon(R, 0, 0, 0.9)); p2.position.set(-30, 0, 26);
    return {
      tinggi: 40,
      gerak(t) {
        lengan.rotation.y = t * 0.5;
        tetes.forEach(({ o, f }) => { const u = fr(t / 1.2 + f); o.position.set(-15, 12.4 - 11.6 * u * u, -6); o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.15))); });
        bolak(truk, -20, 34, 18, 34, t, 10);
        pohonG.rotation.z = 0.04 * Math.sin(t * 1.4); p2.rotation.z = 0.05 * Math.sin(t * 1.6 + 1);
      },
    };
  },

  // Konstruksi: gedung setengah jadi, crane menara berputar mengangkat beban, truk molen berputar, pekerja berhelm
  crane(c) {
    const S = c.S;
    const bx = -16, bz = -6;
    for (let f = 0; f < 4; f++) {
      S.kotak(bx, f * 9, bz, 24, 1, 20, 'dinding2');
      if (f < 3) [[-11, -9], [11, -9], [11, 9], [-11, 9], [0, -9], [0, 9]].forEach(([a, b]) => S.kotak(bx + a, f * 9 + 1, bz + b, 1.4, 8, 1.4, 'logam2'));
    }
    S.kotak(bx - 6, 27, bz - 4, 12, 6, 12, 'dinding');
    [-12.6, 0, 12.6].forEach((a) => S.kotak(bx + a, 0, bz + 10.6, 0.4, 30, 0.4, 'aksen2'));
    for (let y = 6; y < 30; y += 6) S.kotak(bx, y, bz + 10.6, 25.6, 0.35, 0.35, 'aksen2');
    // crane menara
    const cx = 18, cz = -20, ch = 54;
    [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]].forEach(([a, b]) => S.kotak(cx + a, 0, cz + b, 0.6, ch, 0.6, 'aksen'));
    for (let y = 4; y < ch; y += 5) { S.kotak(cx, y, cz - 1.6, 3.6, 0.4, 0.4, 'aksen'); S.kotak(cx, y, cz + 1.6, 3.6, 0.4, 0.4, 'aksen'); S.kotak(cx - 1.6, y, cz, 0.4, 0.4, 3.6, 'aksen'); S.kotak(cx + 1.6, y, cz, 0.4, 0.4, 3.6, 'aksen'); }
    S.kotak(cx, 0, cz, 7, 1.4, 7, 'logam2');
    const jib = c.gerak((R) => {
      R.kotak(0, 0, 0, 4.6, 2.4, 4.6, 'aksen');
      R.kotak(1.4, 2.4, 2.4, 3, 3, 2.6, 'kaca');
      R.kotakX(0, 3.4, 0, 38, 1.6, 1.8, 'aksen'); R.kotakX(0, 3.4, 0, 12, 1.4, 1.8, 'aksen', Math.PI);
      R.kotak(-10, 1.4, 0, 3.6, 3.4, 3.6, 'gelap');
      R.batang([0, 4, 0], [0, 11, 0], 0.5, 'aksen', 4); R.batang([0, 11, 0], [22, 4.2, 0], 0.15, 'gelap', 3); R.batang([0, 11, 0], [-11, 4.2, 0], 0.15, 'gelap', 3);
    });
    jib.position.set(cx, ch, cz);
    const troli = c.gerak((R) => R.kotak(0, 0, 0, 2.4, 1, 2.4, 'gelap'), jib);
    const tali = c.gerak((R) => R.kotak(0, -1, 0, 0.18, 1, 0.18, 'gelap'), troli);
    const beban = c.gerak((R) => { R.kotak(0, -3, 0, 1, 1, 1, 'gelap'); R.kotak(0, -4.6, 0, 9, 1.6, 2.6, 'tanah'); R.kotak(0, -3.2, 0, 8, 1.2, 2, 'aksen2'); }, troli);
    const lampu = c.gerak((R) => R.bola(0, 0, 0, 0.7, 'lampu', 1, 6), jib); lampu.position.set(38, 5, 0);
    const molen = c.gerak((R) => kabinTruk(R, 'aksen'));
    const drum = c.gerak((R) => { R.geo(new THREE.CylinderGeometry(2.4, 3.6, 9, 12).rotateZ(Math.PI / 2), 'aksen2'); R.kotak(0, 3.2, 0, 7, 0.8, 0.6, 'aksen'); R.kotak(-1, -3.8, 0, 6, 0.8, 0.6, 'aksen'); }, molen);
    drum.position.set(-2.4, 6.2, 0); drum.rotation.z = -0.15;
    const pekerja = [0, 1].map(() => c.gerak((R) => orang(R, 'aksen2', 0.9, 'helm')));
    return {
      tinggi: 62,
      gerak(t) {
        jib.rotation.y = Math.atan2(-14, -34) + 0.55 * Math.sin(t * 0.35);
        const u = fr(t / 10);
        troli.position.set(kf(u, [[0, 30], [0.3, 30], [0.55, 16], [0.8, 16], [1, 30]]), 2.4, 0);
        const L = kf(u, [[0, 46], [0.15, 46], [0.3, 12], [0.55, 12], [0.7, 30], [0.8, 30], [0.92, 46]]);
        tali.scale.y = L; beban.position.y = -L;
        beban.visible = u < 0.72 || u > 0.98;
        kedip(lampu, t, 1.2);
        bolak(molen, -28, 32, 22, 32, t, 12);
        drum.rotation.x = t * 3;
        bolak(pekerja[0], -30, 14, -4, 16, t, 8);
        bolak(pekerja[1], 0, 10, 10, 2, t, 6, 0.5);
        pekerja.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.4; });
      },
    };
  },

  // Perdagangan: deretan ruko dengan kanopi belang, papan neon berkedip, lapak payung, pejalan kaki, mobil lewat
  toko(c) {
    const S = c.S;
    S.kotak(0, 0, 22, chord(22, 11), 0.3, 11, 'jalan');
    for (let x = -40; x <= 40; x += 10) S.kotak(x, 0.3, 22, 4, 0.1, 0.8, 'marka');
    S.kotak(0, 0, 9, 100, 0.6, 7, 'logam');
    [[-28, 15, 'atap'], [-8, 19, 'atap2'], [12, 14, 'atap']].forEach(([x, h, w], i) => {
      S.kotak(x, 0, -14, 18, h, 16, i === 1 ? 'dinding2' : 'dinding');
      S.pelana(x, h, -14, 19, 5, 17, w);
      S.kotak(x, 0.6, -5.9, 12, 5.4, 0.3, 'kaca');
      S.kotak(x, h - 6, -5.9, 3.4, 3, 0.3, 'kaca'); S.kotak(x + 5, h - 6, -5.9, 3.4, 3, 0.3, 'kaca'); S.kotak(x - 5, h - 6, -5.9, 3.4, 3, 0.3, 'kaca');
      for (let k = 0; k < 6; k++) S.kotak(x - 7.5 + k * 3, 6.8, -3.4, 3, 0.4, 5.4, k % 2 ? 'putih' : 'aksen', 0, 0.35);
      S.kotak(x, 9.4, -5.8, 10, 2.4, 0.5, 'putih');
    });
    const neon = [-28, -8, 12].map((x, i) => { const o = c.gerak((R) => R.kotak(0, 0, 0, 8.4, 1.4, 0.4, i === 1 ? 'aksen' : 'lampu')); o.position.set(x, 9.9, -5.4); return o; });
    S.tabung(36, 0, -6, 0.4, 10, 'batang', 5);
    const payung = c.gerak((R) => { R.kerucut(0, 0, 0, 8, 3, 'aksen2', 10); }); payung.position.set(36, 9, -6);
    S.kotak(36, 0, -6, 8, 3.6, 5, 'tanah'); S.bola(34, 3.8, -6, 1.2, 'aksen', 1, 6); S.bola(37, 3.8, -5, 1.2, 'daun', 1, 6);
    const orangL = [['aksen', -40, 9, -10, 9, 9, 0], ['aksen2', 30, 10, 0, 8, 7, 0.4], ['atap', -20, 8, 20, 10, 12, 0.7]].map(([w, ...a]) => ({ o: c.gerak((R) => orang(R, w)), a }));
    const mobilL = [c.gerak((R) => mobil(R, 'aksen')), c.gerak((R) => mobil(R, 'atap'))];
    const pohonG = c.gerak((R) => pohon(R, 0, 0, 1.1)); pohonG.position.set(28, 0, 2);
    return {
      tinggi: 30,
      gerak(t) {
        neon.forEach((o, i) => kedip(o, t, 1.6, i * 0.33));
        orangL.forEach(({ o, a }, i) => { bolak(o, a[0], a[1], a[2], a[3], t, a[4], a[5]); o.position.y = 0.6 + Math.abs(Math.sin(t * 7 + i)) * 0.4; });
        lintas(mobilL[0], -54, 19.5, 54, 19.5, t, 6);
        lintas(mobilL[1], 54, 25, -54, 25, t, 7.5, 0.5);
        payung.rotation.z = 0.04 * Math.sin(t * 1.5);
        pohonG.rotation.z = 0.05 * Math.sin(t * 1.3);
      },
    };
  },

  // Transportasi & pergudangan: pelabuhan, kapal kontainer bergoyang di air bergelombang, gantry crane memindah kontainer, truk, pesawat
  kontainer(c) {
    const S = c.S;
    c.air(40, 66, 25, 0.4, 0, 8, 12);
    S.kotak(3, 0, 0, 2, 2.4, 70, 'logam2');
    const warnaK = ['aksen', 'aksen2', 'atap', 'atap2', 'logam2'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 1 + ((i + j) % 3); k++) S.kotak(-34 + j * 6.4, k * 3.6, -22 + i * 7.6, 5.6, 3.4, 7, warnaK[(i * 3 + j + k) % 5]);
    S.kotak(-16, 0, 0, 7, 0.3, 90, 'jalan');
    const kapal = c.gerak((R) => {
      R.kotak(0, -2, 0, 13, 6, 38, 'aksen'); R.kotak(0, 3.8, 0, 13.2, 0.4, 38.2, 'putih');
      R.pelana(0, -2, 21, 13, 6, 4, 'aksen', Math.PI / 2);
      R.kotak(0, 4, -15, 11, 9, 6, 'putih'); R.kotak(0, 9.4, -15, 11.4, 2, 6.4, 'kaca'); R.tabung(3, 13, -16, 1.2, 4, 'aksen2', 8);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 1 + ((i + j) % 2); k++) R.kotak(-3 + j * 6, 4.2 + k * 3.6, -6 + i * 7.6, 5.6, 3.4, 7, warnaK[(i + j * 2 + k) % 5]);
    });
    kapal.position.set(26, 0, 4);
    const gx = -6, gz = -4;
    [[-5, -6], [-5, 6], [7, -6], [7, 6]].forEach(([a, b]) => S.kotak(gx + a, 0, gz + b, 1.6, 30, 1.6, 'aksen'));
    S.kotak(gx + 1, 24, gz - 6, 14, 1.4, 1.4, 'aksen'); S.kotak(gx + 1, 24, gz + 6, 14, 1.4, 1.4, 'aksen');
    S.kotakX(gx - 14, 30, gz, 56, 2, 4, 'aksen'); S.kotak(gx - 12, 30, gz, 5, 4, 5, 'gelap'); S.kotak(gx + 1, 31, gz + 2.6, 4, 3, 3, 'kaca');
    const troli = c.gerak((R) => R.kotak(0, 0, 0, 3, 1.4, 4.4, 'gelap')); troli.position.set(0, 29, gz);
    const tali = c.gerak((R) => R.kotak(0, -1, 0, 0.18, 1, 0.18, 'gelap'), troli);
    const spreader = c.gerak((R) => R.kotak(0, 0, 0, 3, 0.6, 7.4, 'lampu'), troli);
    const kont = c.gerak((R) => R.kotak(0, -3.6, 0, 5.6, 3.4, 7, 'aksen2'), spreader);
    const kontDarat = c.gerak((R) => R.kotak(0, 0, 0, 5.6, 3.4, 7, 'aksen2')); kontDarat.position.set(-8, 0, gz);
    const truk = c.gerak((R) => { kabinTruk(R, 'atap'); R.kotak(-2, 2.2, 0, 11, 4, 5.6, 'aksen'); });
    const pesawat = c.gerak((R) => {
      R.geo(new THREE.CylinderGeometry(1.6, 1.2, 18, 10).rotateZ(Math.PI / 2), 'putih');
      R.bola(9, 0, 0, 1.6, 'putih', 1, 8); R.kotak(0, -0.2, 0, 4, 0.4, 20, 'logam2'); R.kotak(-8, 0, 0, 2.4, 5, 0.4, 'aksen'); R.kotak(-8, 0, 0, 2, 0.3, 7, 'logam2');
    });
    return {
      tinggi: 34,
      gerak(t) {
        kapal.position.y = 0.6 + Math.sin(t * 1.4) * 0.5;
        kapal.rotation.z = Math.sin(t * 1.1) * 0.025; kapal.rotation.x = Math.sin(t * 0.8) * 0.015;
        const u = fr(t / 10);
        troli.position.x = kf(u, [[0, -8], [0.32, -8], [0.55, 26], [0.8, 26], [1, -8]]);
        const L = kf(u, [[0, 6], [0.12, 25.4], [0.22, 25.4], [0.32, 6], [0.55, 6], [0.66, 16], [0.74, 16], [0.82, 6]]);
        tali.scale.y = L; spreader.position.y = -L;
        kont.visible = u > 0.2 && u < 0.72;
        kontDarat.visible = u < 0.2 || u > 0.95;
        lintas(truk, -16, 50, -16, -50, t, 7);
        const v = fr(t / 12);
        pesawat.position.set(-70 + 140 * v, 72 + 6 * v, -30 + 10 * v);
        pesawat.scale.setScalar(Math.max(0.001, Math.min(1, v / 0.06, (1 - v) / 0.06)));
        pesawat.rotation.set(0.05, -0.07, 0.05);
      },
    };
  },

  // Akomodasi & makan minum: menara hotel dengan jendela menyala, kolam renang beriak + perenang, payung, restoran berasap
  hotel(c) {
    const S = c.S;
    const hx = -16, hz = -14;
    S.kotak(hx, 0, hz, 20, 52, 16, 'dinding'); S.kotak(hx, 52, hz, 21, 2, 17, 'atap'); S.kotak(hx + 4, 54, hz - 2, 6, 3, 5, 'logam2');
    for (let y = 6; y < 50; y += 5) { S.kotak(hx, y, hz + 8.05, 17, 2.4, 0.2, 'kaca'); S.kotak(hx + 10.05, y, hz, 0.2, 2.4, 13, 'kaca'); }
    S.kotak(hx, 0, hz + 9, 12, 4, 3, 'aksen2'); S.kotak(hx, 4, hz + 9.5, 14, 0.6, 4.6, 'aksen');
    const jendela = [[hx - 4, 21], [hx + 3, 36], [hx + 6, 11], [hx - 6, 46]].map(([x, y], i) => { const o = c.gerak((R) => R.kotak(0, 0, 0, 3.4, 2.4, 0.3, 'lampu')); o.position.set(x, y, hz + 8.2); o.userData.f = i * 0.37; return o; });
    S.kotak(16, 0, 8, 28, 1.6, 20, 'putih'); S.kotak(16, 0, 8, 25, 1.7, 17, 'air2');
    c.air(24, 15, 16, 1.4, 8, 8, 5);
    const perenang = c.gerak((R) => { R.bola(0, 0, 0, 1.1, 'kulit', 1, 6); R.kotak(-1.8, -0.6, 0, 3, 0.6, 1.2, 'aksen'); });
    const payung = [[2, -6], [32, 22]].map(([x, z]) => { S.tabung(x, 0, z, 0.3, 8, 'batang', 5); S.kotak(x + 2, 0, z + 3, 5, 1.2, 2.4, 'putih'); const o = c.gerak((R) => R.kerucut(0, 0, 0, 5.4, 2.4, 'aksen', 10)); o.position.set(x, 7.4, z); return o; });
    S.kotak(28, 0, -22, 16, 9, 12, 'dinding2'); S.pelana(28, 9, -22, 17, 4, 13, 'atap'); S.tabung(33, 9, -25, 1.2, 9, 'logam2', 8);
    S.kotak(28, 1, -15.9, 10, 4, 0.3, 'kaca');
    const asap = c.titik(null, [33, 18.5, -25]);
    c.kepul(asap, { per: 3, n: 9, naik: 24, geser: 7, r: 3.6 });
    const tamu = [c.gerak((R) => orang(R, 'aksen')), c.gerak((R) => orang(R, 'putih'))];
    const palem = c.gerak((R) => { for (let k = 0; k < 7; k++) R.kotakX(0, 0, 0, 9, 0.5, 2.2, k % 2 ? 'daun' : 'daun2', k * 0.9, -0.4); });
    S.tabung(-38, 0, 14, 1, 20, 'batang', 6, 0.8); palem.position.set(-38, 20, 14);
    return {
      tinggi: 58,
      gerak(t) {
        jendela.forEach((o) => { o.visible = fr(t / 5 + o.userData.f) < 0.7; });
        bolak(perenang, 7, 4, 26, 4, t, 9); perenang.position.y = 1.6 + Math.sin(t * 6) * 0.2;
        payung.forEach((o, i) => { o.rotation.z = 0.05 * Math.sin(t * 1.4 + i); });
        bolak(tamu[0], -4, 24, 22, 26, t, 11);
        bolak(tamu[1], -30, 8, -6, 4, t, 9, 0.5);
        tamu.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.4; });
        palem.rotation.z = 0.06 * Math.sin(t * 1.2); palem.rotation.x = 0.04 * Math.sin(t);
      },
    };
  },

  // Informasi & komunikasi: menara BTS kisi dengan gelombang sinyal, parabola melirik, data mengalir lewat kabel, kurir motor, teknisi memanjat
  menara(c) {
    const S = c.S;
    const mx = -8, mz = -12, mh = 62;
    [[-6, -6], [6, -6], [6, 6], [-6, 6]].forEach(([a, b]) => S.batang([mx + a, 0, mz + b], [mx + a * 0.2, mh, mz + b * 0.2], 0.45, 'batang', 4));
    for (let y = 8; y < mh; y += 8) {
      const k = 6 * (1 - y / mh * 0.8);
      S.kotak(mx, y, mz - k, 2 * k, 0.4, 0.4, 'batang'); S.kotak(mx, y, mz + k, 2 * k, 0.4, 0.4, 'batang');
      S.kotak(mx - k, y, mz, 0.4, 0.4, 2 * k, 'batang'); S.kotak(mx + k, y, mz, 0.4, 0.4, 2 * k, 'batang');
    }
    S.tabung(mx, mh, mz, 0.4, 10, 'putih', 6);
    [[0, 1.8], [2.1, 0], [-2.1, 0]].forEach(([dx, dz], i) => S.kotak(mx + dx, 48, mz + dz + (i ? 0 : 0), 1.4 + (dz ? 1 : 0), 6, 1.4 + (dx ? 1 : 0), 'aksen'));
    S.tabung(mx, 52, mz + 1.4, 2.4, 0.8, 'logam', 12);
    const lampu = c.gerak((R) => R.bola(0, 0, 0, 0.8, 'aksen', 1, 6)); lampu.position.set(mx, mh + 10.4, mz);
    const cincin = [0, 1, 2].map(() => {
      const mat = new THREE.MeshBasicMaterial({ color: 0x9A9A99, transparent: true, depthWrite: false });
      const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 4, 40).rotateX(Math.PI / 2), mat);
      m.position.set(mx, 51, mz); c.isi.add(m); c.khusus.push({ mat, peran: 'aksen' });
      return m;
    });
    S.kotak(18, 0, 6, 16, 9, 12, 'dinding'); S.kotak(18, 9, 6, 17, 0.8, 13, 'atap'); S.kotak(18, 0.6, 12.1, 3, 6, 0.3, 'aksen2');
    const piringan = c.gerak((R) => {
      R.tabung(0, 0, 0, 0.6, 3, 'logam2', 6);
      R.geo(new THREE.SphereGeometry(4.2, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2.6).rotateX(-Math.PI / 2 - 0.6), 'putih', M(0, 4.4, 0));
      R.batang([0, 4.4, 0], [0, 5.6, 3.2], 0.15, 'gelap', 3);
    });
    piringan.position.set(14, 9.8, 4);
    S.batang([mx + 2, 30, mz + 2], [24, 9, 2], 0.25, 'gelap', 3);
    const data = [0, 1, 2].map((i) => ({ o: c.gerak((R) => R.bola(0, 0, 0, 0.8, 'lampu', 1, 6)), f: i / 3 }));
    const motor = c.gerak((R) => { R.kotak(0, 1.2, 0, 6, 1.4, 1.4, 'aksen'); R.roda(-2.4, 1.2, 0, 1.2, 0.6); R.roda(2.4, 1.2, 0, 1.2, 0.6); R.kotak(-2, 2.6, 0, 3, 2.6, 3, 'aksen2'); });
    const pengemudi = c.gerak((R) => orang(R, 'gelap', 0.85, 'helm'), motor); pengemudi.position.set(0.6, 1.4, 0);
    const teknisi = c.gerak((R) => orang(R, 'aksen2', 0.8, 'helm'));
    return {
      tinggi: 72,
      gerak(t) {
        kedip(lampu, t, 1.4);
        cincin.forEach((m, i) => { const u = fr(t / 2.4 + i / 3); const r = 3 + 30 * u; m.scale.set(r, 1, r); m.material.opacity = (1 - u) * 0.9; });
        piringan.rotation.y = -0.6 + 0.25 * Math.sin(t * 2 * Math.PI / 5);
        data.forEach(({ o, f }) => { const u = fr(t / 2 + f); o.position.set(lerp(mx + 2, 24, u), lerp(30, 9, u), lerp(mz + 2, 2, u)); o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.15, (1 - u) / 0.15))); });
        lintas(motor, -52, 28, 52, 28, t, 5);
        const v = pingpong(t, 14);
        teknisi.position.set(mx + 5.2 - v * 3.6, 2 + v * 34, mz + 5.6 - v * 3.6); teknisi.rotation.y = -0.8;
      },
    };
  },

  // Jasa keuangan: gedung bank bertiang, koin naik berputar, ATM berkedip, antrean nasabah, mobil lewat
  bank(c) {
    const S = c.S;
    S.kotak(-4, 0, -8, 40, 1.6, 28, 'putih'); S.kotak(-4, 1.6, -9, 36, 1.4, 25, 'logam');
    S.kotak(-4, 3, -14, 30, 16, 14, 'dinding');
    for (let i = 0; i < 6; i++) S.tabung(-16.5 + i * 5, 3, -5, 1.3, 15, 'putih', 10);
    S.kotak(-4, 18, -8.6, 33, 2.6, 18, 'putih');
    S.pelana(-4, 20.6, -8.6, 33, 6, 18, 'atap');
    S.kotak(-4, 21.4, 0.4, 10, 2, 0.4, 'aksen');
    S.kotak(-4, 3, -6.9, 5, 8, 0.4, 'kaca');
    const koin = [0, 1, 2, 3].map((i) => ({ o: c.gerak((R) => { R.geo(new THREE.CylinderGeometry(2.2, 2.2, 0.7, 16).rotateX(Math.PI / 2), 'lampu'); R.geo(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12).rotateX(Math.PI / 2), 'aksen'); }), f: i / 4 }));
    S.kotak(26, 0, 4, 6, 9, 5, 'dinding2'); S.kotak(26, 9, 4, 7, 0.6, 6, 'atap'); S.kotak(26, 3.6, 6.6, 3, 3, 0.3, 'kaca');
    const atm = c.gerak((R) => R.kotak(0, 0, 0, 2.4, 0.8, 0.3, 'lampu')); atm.position.set(26, 7.4, 6.7);
    const antre = ['aksen', 'aksen2', 'atap'].map((w) => c.gerak((R) => orang(R, w)));
    const mobil1 = c.gerak((R) => mobil(R, 'gelap', 11));
    S.kotak(0, 0, 32, chord(32, 10), 0.3, 10, 'jalan');
    const pohonG = [[-38, 12], [36, -16]].map(([x, z]) => { const o = c.gerak((R) => pohon(R, 0, 0, 1.1)); o.position.set(x, 0, z); return o; });
    return {
      tinggi: 36,
      gerak(t) {
        koin.forEach(({ o, f }, i) => {
          const u = fr(t / 1.8 / 1.5 + f);
          o.position.set(-4 + (i - 1.5) * 4, 28 + 18 * u, -9);
          o.rotation.y = t * 3 + i;
          o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.2, (1 - u) / 0.3)));
        });
        kedip(atm, t, 1.6);
        antre.forEach((o, i) => { bolak(o, 14 + i * 3, 14, 22 + i * 1.5, 10, t, 6 + i, i * 0.3); o.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.4; });
        lintas(mobil1, -54, 32, 54, 32, t, 6);
        pohonG.forEach((o, i) => { o.rotation.z = 0.05 * Math.sin(t * 1.3 + i); });
      },
    };
  },

  // Real estat: kompleks rumah beratap pelana, cerobong berasap, jendela menyala, mobil & pejalan kaki
  rumah(c) {
    const S = c.S;
    S.kotak(4, 0, 26, chord(26, 10), 0.3, 10, 'jalan');
    const rumah = [[-26, -16, 14, 9, 12, 'atap'], [0, -24, 16, 10, 12, 'atap2'], [24, -10, 13, 8, 11, 'atap'], [-30, 8, 12, 8, 10, 'atap2'], [2, 2, 14, 9, 11, 'atap']];
    rumah.forEach(([x, z, w, h, d, r], i) => {
      S.kotak(x, 0, z, w, h, d, i % 2 ? 'dinding2' : 'dinding');
      S.pelana(x, h, z, w + 1.6, 5.5, d + 1.6, r, i === 2 ? Math.PI / 2 : 0);
      S.kotak(x - w / 4, 1, z + d / 2 + 0.05, 2.6, 3.2, 0.25, 'kaca'); S.kotak(x + w / 4, 0, z + d / 2 + 0.05, 2.6, 5, 0.25, 'aksen2');
      S.kotak(x, 0, z + d / 2 + 4, w + 2, 1.6, 0.4, 'putih');
    });
    S.tabung(-22, 9, -18, 1.1, 9, 'logam2', 8); S.tabung(4, 10, -26, 1, 9, 'logam2', 8);
    c.kepul(c.titik(null, [-22, 18.4, -18]), { per: 3.4, n: 9, naik: 22, geser: 7, r: 3.4 });
    c.kepul(c.titik(null, [4, 19.4, -26]), { per: 3.8, n: 9, naik: 20, geser: 7, r: 3.2, fase: 0.5 });
    const lampu = [[-30, 2.8, 13.2], [2, 2.8, 7.7], [24, 2.6, -4.3]].map((p, i) => { const o = c.gerak((R) => R.kotak(0, 0, 0, 2.4, 2.4, 0.3, 'lampu')); o.position.set(...p); o.userData.f = i * 0.4; return o; });
    const pohonG = [[38, 10, 1.1], [-12, -4, 0.8], [18, -26, 0.9]].map(([x, z, s]) => { const o = c.gerak((R) => pohon(R, 0, 0, s)); o.position.set(x, 0, z); return o; });
    const mobil1 = c.gerak((R) => mobil(R, 'aksen'));
    const warga = [c.gerak((R) => orang(R, 'aksen2')), c.gerak((R) => R.kotak(0, 0.6, 0, 2.4, 1.4, 1, 'batang'))];
    return {
      tinggi: 24,
      gerak(t) {
        lampu.forEach((o) => { o.visible = fr(t / 6 + o.userData.f) < 0.6; });
        pohonG.forEach((o, i) => { o.rotation.z = 0.05 * Math.sin(t * 1.3 + i * 2); });
        lintas(mobil1, 58, 25, -50, 25, t, 6.5);
        bolak(warga[0], -20, 19, 20, 19, t, 14);
        warga[1].position.copy(warga[0].position); warga[1].position.x += maju(t, 14) ? 3.5 : -3.5; warga[1].rotation.y = warga[0].rotation.y;
        warga[0].position.y = Math.abs(Math.sin(t * 7)) * 0.4; warga[1].position.y = Math.abs(Math.sin(t * 11)) * 0.5;
      },
    };
  },

  // Jasa perusahaan: menara kaca, helikopter melayang di helipad, gondola pembersih kaca naik-turun, karyawan, mobil
  kantor(c) {
    const S = c.S;
    const kx = -10, kz = -14, kh = 64;
    S.kotak(kx, 0, kz, 20, kh, 18, 'kaca');
    for (let y = 5; y < kh; y += 5) S.kotak(kx, y, kz, 20.4, 0.5, 18.4, 'putih');
    S.kotak(kx - 10.1, 0, kz, 0.4, kh, 18.4, 'aksen'); S.kotak(kx, kh, kz, 21, 1.4, 19, 'putih');
    S.tabung(kx, kh + 1.4, kz, 7, 0.6, 'gelap', 20); S.kotak(kx - 2, kh + 2, kz, 0.8, 0.1, 5, 'putih'); S.kotak(kx + 2, kh + 2, kz, 0.8, 0.1, 5, 'putih'); S.kotak(kx, kh + 2, kz, 4, 0.1, 0.8, 'putih');
    S.kotak(20, 0, -2, 18, 24, 16, 'dinding'); S.kotak(20, 24, -2, 19, 2, 17, 'atap');
    for (let y = 4; y < 24; y += 5) S.kotak(20, y, 6.05, 15, 2.4, 0.2, 'kaca');
    const lampu = [[16, 9], [24, 14], [20, 19]].map(([x, y], i) => { const o = c.gerak((R) => R.kotak(0, 0, 0, 3, 2.4, 0.3, 'lampu')); o.position.set(x, y, 6.2); o.userData.f = i * 0.3; return o; });
    const gondola = c.gerak((R) => { R.kotak(0, 0, 0, 7, 1.6, 1.8, 'aksen'); R.batang([-3, 1.6, 0], [-3, 30, 0], 0.1, 'gelap', 3); R.batang([3, 1.6, 0], [3, 30, 0], 0.1, 'gelap', 3); orang(R, 'putih', 0.6, 'helm'); });
    const heli = c.gerak((R) => {
      R.bola(0, 0, 0, 3.4, 'aksen', 0.75, 10); R.bola(1.8, 0.4, 0, 2.2, 'kaca', 0.7, 8);
      R.kotakX(-2, 0.4, 0, -8, 1, 1, 'aksen'); R.kotak(-10, 0, 0, 0.4, 3.4, 1.6, 'aksen2');
      R.kotak(0, -3.6, -2, 7, 0.4, 0.5, 'gelap'); R.kotak(0, -3.6, 2, 7, 0.4, 0.5, 'gelap'); R.tabung(0, 2.2, 0, 0.4, 1.2, 'gelap', 6);
    });
    const rotor = c.gerak((R) => { R.kotak(0, 0, 0, 16, 0.25, 1, 'gelap'); R.kotak(0, 0, 0, 1, 0.25, 16, 'gelap'); }, heli); rotor.position.y = 3.4;
    const ekor = c.gerak((R) => { R.kotak(0, 0, 0, 0.3, 4, 0.6, 'gelap'); }, heli); ekor.position.set(-10, 1.2, 1);
    const karyawan = [c.gerak((R) => orang(R, 'gelap')), c.gerak((R) => orang(R, 'aksen'))];
    const mobil1 = c.gerak((R) => mobil(R, 'putih'));
    S.kotak(0, 0, 26, chord(26, 10), 0.3, 10, 'jalan');
    const pohonG = c.gerak((R) => pohon(R, 0, 0, 1.1)); pohonG.position.set(36, 0, 14);
    return {
      tinggi: 76,
      gerak(t) {
        lampu.forEach((o) => { o.visible = fr(t / 4 + o.userData.f) < 0.65; });
        gondola.position.set(kx + 2, 6 + 44 * pingpong(t, 16), kz + 10);
        heli.position.set(kx + Math.sin(t * 0.6) * 2, kh + 13 + Math.sin(t * 2.4) * 1.6, kz + Math.cos(t * 0.5) * 1.5);
        heli.rotation.set(Math.sin(t * 1.3) * 0.04, 0.6 + Math.sin(t * 0.4) * 0.2, Math.sin(t * 1.7) * 0.05);
        rotor.rotation.y = t * 22; ekor.rotation.z = t * 30;
        bolak(karyawan[0], -30, 16, 4, 14, t, 10); bolak(karyawan[1], 30, 16, 6, 12, t, 8, 0.4);
        karyawan.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.4; });
        lintas(mobil1, -54, 27, 54, 27, t, 6);
        pohonG.rotation.z = 0.05 * Math.sin(t * 1.3);
      },
    };
  },

  // Pemerintahan: kantor berkubah, bendera merah-putih berkibar, air mancur memercik, mobil dinas, pegawai
  pemda(c) {
    const S = c.S;
    S.kotak(-4, 0, -14, 42, 1.4, 22, 'logam');
    S.kotak(-4, 1.4, -16, 38, 13, 16, 'putih'); S.kotak(-4, 1.4, -16, 14, 16, 18, 'dinding');
    S.kotak(-4, 17.4, -16, 15, 1.4, 19, 'atap');
    for (let i = 0; i < 5; i++) S.tabung(-10 + i * 3, 1.4, -6.6, 0.8, 14, 'putih', 8);
    S.tabung(-4, 18.8, -16, 6.4, 3, 'dinding', 18); S.bola(-4, 21.8, -16, 6.4, 'aksen2', 0.8, 16); S.tabung(-4, 26.6, -16, 0.3, 4, 'gelap', 5);
    for (let i = 0; i < 6; i++) { S.kotak(-20 + i * 3, 5, -7.9, 1.8, 3, 0.3, 'kaca'); S.kotak(6 + i * 3, 5, -7.9, 1.8, 3, 0.3, 'kaca'); }
    S.tabung(26, 0, -4, 0.45, 34, 'batang', 6); S.bola(26, 34.2, -4, 0.7, 'lampu', 1, 6);
    c.bendera(26.3, 33.6, -4, 10, 6);
    S.tabung(4, 0, 18, 9, 2.4, 'logam2', 22); S.tabung(4, 0, 18, 8, 2.5, 'air2', 22); S.tabung(4, 0, 18, 1.2, 6, 'putih', 10); S.tabung(4, 5, 18, 3, 0.8, 'putih', 14);
    c.kepul(c.titik(null, [4, 6.4, 18]), { warna: '#DCE1E3', per: 1, n: 10, mancur: true, r: 0.7 });
    const mobilD = c.gerak((R) => mobil(R, 'gelap', 11));
    const pegawai = [c.gerak((R) => orang(R, 'tanah')), c.gerak((R) => orang(R, 'tanah2'))];
    S.kotak(0, 0, 33, chord(33, 9), 0.3, 9, 'jalan');
    const pohonG = [[-34, 12], [-24, 26]].map(([x, z]) => { const o = c.gerak((R) => pohon(R, 0, 0, 1)); o.position.set(x, 0, z); return o; });
    return {
      tinggi: 40,
      gerak(t) {
        bolak(mobilD, -40, 33, 40, 33, t, 12);
        bolak(pegawai[0], -14, 4, 14, 8, t, 9); bolak(pegawai[1], 18, 10, 30, 22, t, 7, 0.5);
        pegawai.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 7 + i)) * 0.4; });
        pohonG.forEach((o, i) => { o.rotation.z = 0.05 * Math.sin(t * 1.3 + i); });
      },
    };
  },

  // Pendidikan: sekolah bentuk L, lapangan dengan bola memantul di antara murid, bendera berkibar, murid berjalan
  sekolah(c) {
    const S = c.S;
    S.kotak(-6, 0, -22, 40, 12, 12, 'dinding'); S.pelana(-6, 12, -22, 41.6, 5, 13.6, 'atap');
    S.kotak(-30, 0, -6, 12, 12, 22, 'dinding2'); S.pelana(-30, 12, -6, 13.6, 5, 23.6, 'atap', Math.PI / 2);
    for (let i = 0; i < 7; i++) { S.kotak(-22 + i * 5.4, 3, -15.9, 3, 3, 0.2, 'kaca'); S.kotak(-22 + i * 5.4, 7.6, -15.9, 3, 3, 0.2, 'kaca'); }
    for (let i = 0; i < 3; i++) S.kotak(-23.9, 3, -12 + i * 6, 0.2, 3, 3, 'kaca');
    S.kotak(-6, 0, -15.8, 4, 6, 0.3, 'aksen2');
    S.kotak(14, 0, 12, 36, 0.5, 26, 'daun');
    S.kotak(14, 0.5, 12, 0.4, 0.05, 26, 'marka'); S.piring(14, 0.56, 12, 4, 4.5, 'marka', 24);
    S.kotak(-3.5, 0, 12, 1, 6, 8, 'putih'); S.kotak(31.5, 0, 12, 1, 6, 8, 'putih');
    S.tabung(-20, 0, 22, 0.4, 28, 'batang', 6);
    c.bendera(-19.7, 27.6, 22, 8, 5);
    const bola = c.gerak((R) => R.bola(0, 0, 0, 1.4, 'putih', 1, 8));
    const murid = [['aksen', 4, 10], ['aksen2', 24, 14], ['atap', 14, 4]].map(([w, x, z]) => { const o = c.gerak((R) => orang(R, w, 0.8)); o.position.set(x, 0.5, z); return o; });
    const berjalan = c.gerak((R) => orang(R, 'aksen', 0.8));
    const pohonG = c.gerak((R) => pohon(R, 0, 0, 1.2)); pohonG.position.set(36, 0, -16);
    return {
      tinggi: 32,
      gerak(t) {
        const p = pingpong(t, 2.6);
        bola.position.set(lerp(6, 22, p), 1.9 + 7 * Math.abs(Math.sin(t * Math.PI / 0.65)), lerp(10, 14, p));
        murid[0].rotation.y = -0.2; murid[1].rotation.y = Math.PI + 0.2;
        murid.forEach((m, i) => { m.position.y = 0.5 + Math.max(0, Math.sin(t * 4.8 + i * 2)) * 1.2; });
        bolak(berjalan, -16, 6, -6, 30, t, 9); berjalan.position.y = Math.abs(Math.sin(t * 7)) * 0.4;
        pohonG.rotation.z = 0.05 * Math.sin(t * 1.3);
      },
    };
  },

  // Kesehatan: rumah sakit dengan palang, helikopter ambulans melayang, ambulans berlampu kedip, perawat & pasien
  rs(c) {
    const S = c.S;
    const rx = -10, rz = -14;
    S.kotak(rx, 0, rz, 30, 28, 18, 'putih'); S.kotak(rx, 28, rz, 31, 1.4, 19, 'logam');
    S.kotak(16, 0, -16, 16, 16, 18, 'logam'); S.kotak(16, 16, -16, 17, 1.2, 19, 'atap');
    for (let y = 5; y < 26; y += 6) for (let i = 0; i < 5; i++) S.kotak(rx - 11 + i * 5.5, y, rz + 9.05, 3, 3, 0.2, 'kaca');
    for (let y = 4; y < 15; y += 5) for (let i = 0; i < 3; i++) S.kotak(10.5 + i * 5.5, y, -6.95, 3, 2.6, 0.2, 'kaca');
    S.kotak(rx, 19, rz + 9.2, 2.4, 7.2, 0.4, 'aksen'); S.kotak(rx, 21.4, rz + 9.2, 7.2, 2.4, 0.4, 'aksen');
    S.kotak(rx, 4, rz + 12, 14, 0.8, 6, 'putih'); S.kotak(rx - 6, 0, rz + 14.5, 0.6, 4, 0.6, 'logam2'); S.kotak(rx + 6, 0, rz + 14.5, 0.6, 4, 0.6, 'logam2');
    S.tabung(rx, 29.4, rz, 7, 0.5, 'gelap', 20); S.kotak(rx - 2, 30, rz, 0.8, 0.1, 5, 'putih'); S.kotak(rx + 2, 30, rz, 0.8, 0.1, 5, 'putih'); S.kotak(rx, 30, rz, 4, 0.1, 0.8, 'putih');
    S.kotak(4, 0, 26, chord(26, 10), 0.3, 10, 'jalan');
    const heli = c.gerak((R) => {
      R.bola(0, 0, 0, 3.4, 'putih', 0.75, 10); R.bola(1.8, 0.4, 0, 2.2, 'kaca', 0.7, 8); R.kotak(0, -1, 0, 4, 1, 6.9, 'aksen');
      R.kotakX(-2, 0.4, 0, -8, 1, 1, 'putih'); R.kotak(-10, 0, 0, 0.4, 3.4, 1.6, 'aksen');
      R.kotak(0, -3.6, -2, 7, 0.4, 0.5, 'gelap'); R.kotak(0, -3.6, 2, 7, 0.4, 0.5, 'gelap'); R.tabung(0, 2.2, 0, 0.4, 1.2, 'gelap', 6);
    });
    const rotor = c.gerak((R) => { R.kotak(0, 0, 0, 16, 0.25, 1, 'gelap'); R.kotak(0, 0, 0, 1, 0.25, 16, 'gelap'); }, heli); rotor.position.y = 3.4;
    const amb = c.gerak((R) => { R.kotak(-1, 1.2, 0, 10, 6, 5.4, 'putih'); R.kotak(5, 1.2, 0, 3, 4, 5.2, 'putih'); R.kotak(5.8, 3, 0, 1.6, 2, 5.3, 'kaca'); R.kotak(-1, 4, 2.75, 4, 1.2, 0.1, 'aksen'); R.kotak(-1, 3.2, 2.75, 1.2, 2.8, 0.1, 'aksen'); [-3.5, 4].forEach((x) => [-1, 1].forEach((sz) => R.roda(x, 1.3, sz * 2.7, 1.3, 1))); });
    const sirene = c.gerak((R) => { R.kotak(-1.4, 0, 0, 1.6, 0.9, 1.2, 'aksen'); R.kotak(1.4, 0, 0, 1.6, 0.9, 1.2, 'lampu'); }, amb); sirene.position.set(-1, 7.2, 0);
    const perawat = c.gerak((R) => orang(R, 'putih'));
    const pasien = c.gerak((R) => { R.kotak(0, 1.6, 0, 3, 0.4, 2.4, 'logam2'); R.roda(-1, 0.6, -1, 0.6, 0.3); R.roda(-1, 0.6, 1, 0.6, 0.3); orang(R, 'aksen2', 0.8); });
    const pohonG = c.gerak((R) => pohon(R, 0, 0, 1.2)); pohonG.position.set(34, 0, 8);
    return {
      tinggi: 44,
      gerak(t) {
        heli.position.set(rx + Math.sin(t * 0.5) * 2, 40 + Math.sin(t * 2.2) * 1.8, rz + Math.cos(t * 0.6) * 1.5);
        heli.rotation.set(Math.sin(t * 1.2) * 0.04, -0.5 + Math.sin(t * 0.4) * 0.2, Math.sin(t * 1.6) * 0.05);
        rotor.rotation.y = t * 22;
        lintas(amb, -56, 24, 56, 24, t, 6);
        sirene.rotation.y = fr(t / 0.6) < 0.5 ? 0 : Math.PI;
        bolak(perawat, -22, 8, 0, 12, t, 8); perawat.position.y = Math.abs(Math.sin(t * 7)) * 0.4;
        pasien.position.copy(perawat.position); pasien.position.x += maju(t, 8) ? 4 : -4; pasien.position.y = 0; pasien.rotation.y = perawat.rotation.y;
        pohonG.rotation.z = 0.05 * Math.sin(t * 1.3);
      },
    };
  },

  // Jasa lainnya: bianglala berputar dengan kabin tetap tegak, kolam dengan perahu, balon terbang, pengunjung
  taman(c) {
    const S = c.S;
    const fx = -12, fz = -14, fh = 34;
    [[-9, -4], [9, -4], [-9, 4], [9, 4]].forEach(([a, b]) => S.batang([fx + a, 0, fz + b], [fx, fh, fz + b * 0.5], 0.6, 'batang', 5));
    S.batang([fx, fh, fz - 2], [fx, fh, fz + 2], 0.8, 'gelap', 6);
    S.kotak(fx, 0, fz, 22, 1, 12, 'logam2');
    const roda = c.gerak((R) => {
      R.cincin(0, 0, 0, 22, 0.55, 'aksen'); R.cincin(0, 0, 0, 12, 0.3, 'aksen2');
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; R.batang([0, 0, 0], [Math.cos(a) * 22, Math.sin(a) * 22, 0], 0.22, 'batang', 3); }
    });
    roda.position.set(fx, fh, fz + 1.8);
    const kabin = [];
    for (let k = 0; k < 10; k++) {
      const piv = new THREE.Group(); const a = k * Math.PI / 5; piv.position.set(Math.cos(a) * 22, Math.sin(a) * 22, 0); roda.add(piv);
      const o = c.gerak((R) => { R.batang([0, 0, 0], [0, -2.4, 0], 0.15, 'gelap', 3); R.kotak(0, -5.6, 0, 3.6, 3.4, 3.2, k % 2 ? 'aksen' : 'aksen2'); R.kotak(0, -2.4, 0, 4, 0.5, 3.6, 'atap'); }, piv);
      kabin.push(o);
    }
    c.air(26, 18, 22, 0.4, 14, 8, 6);
    S.kotak(22, 0, 14, 29, 0.6, 21, 'tanah2');
    const perahu = c.gerak((R) => { R.kotak(0, 0, 0, 6, 1.6, 3.2, 'putih'); R.bola(3, 1.6, 0, 1.2, 'aksen', 1, 6); R.kotak(3, 1.6, 0, 0.8, 4, 0.8, 'putih'); orang(R, 'aksen', 0.6); });
    const balon = [0, 1, 2].map((i) => ({ o: c.gerak((R) => { R.bola(0, 0, 0, 2.2, i % 2 ? 'aksen' : 'lampu', 1.2, 8); R.batang([0, -2.6, 0], [0.4, -8, 0], 0.08, 'gelap', 3); }), f: i / 3 }));
    S.kotak(36, 0, -12, 6, 5, 4, 'dinding2'); S.kerucut(36, 5, -12, 4.4, 2.6, 'aksen2', 8);
    const pohonG = [[-40, 12, 1.1], [-26, 24, 0.9], [4, 26, 1]].map(([x, z, s]) => { const o = c.gerak((R) => pohon(R, 0, 0, s)); o.position.set(x, 0, z); return o; });
    S.kotak(-6, 0, 16, 7, 1.6, 2, 'batang'); S.kotak(-6, 1.6, 15.2, 7, 2, 0.4, 'batang');
    const pengunjung = [c.gerak((R) => orang(R, 'aksen2')), c.gerak((R) => orang(R, 'atap', 0.75))];
    return {
      tinggi: 60,
      gerak(t) {
        roda.rotation.z = t * 0.35;
        kabin.forEach((o) => { o.rotation.z = -roda.rotation.z + Math.sin(t * 1.5) * 0.04; });
        perahu.position.set(22 + Math.sin(t * 0.45) * 7, 1.1 + Math.sin(t * 2) * 0.3, 14 + Math.cos(t * 0.45) * 4);
        perahu.rotation.y = -t * 0.45 + Math.PI / 2; perahu.rotation.z = Math.sin(t * 2.1) * 0.05;
        balon.forEach(({ o, f }, i) => { const u = fr(t / 9 + f); o.position.set(36 + Math.sin(t + i) * 3 + u * 6, 10 + 70 * u, -12 - u * 6); o.scale.setScalar(Math.max(0.001, Math.min(1, u / 0.1, (1 - u) / 0.15))); });
        pohonG.forEach((o, i) => { o.rotation.z = 0.05 * Math.sin(t * 1.3 + i); });
        bolak(pengunjung[0], -30, 4, 0, 30, t, 12); bolak(pengunjung[1], -26, 6, 2, 32, t, 12, 0.02);
        pengunjung.forEach((p, i) => { p.position.y = Math.abs(Math.sin(t * 7 + i * 1.3)) * 0.4; });
      },
    };
  },
};
const lerp = (a, b, t) => a + (b - a) * t;
NETRAL.garisT = '#7D7D7C'; NETRAL_C.garisT = new Color('#7D7D7C');

// ---------- pembangun adegan ----------
const _w = new Vector3();
export function buatAdegan(ikon, opsi = {}) {
  const bahan = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const root = new THREE.Group(), isi = new THREE.Group();
  root.add(isi);
  const meshes = [], ombak = [], emit = [], khusus = [];
  const S = new Rakit();
  // petak bundar: alas, tepi berwarna peran "atap", tiang ke laut bila di luar daratan
  if (!opsi.ikon) { S.tabung(0, -5, 0, 60, 5, 'petakSisi', 48); S.tabung(0, -5, 0, 57.6, 5.08, 'petak', 48); S.piring(0, 0.06, 0, 57.6, 60, 'atap', 48); }
  if (opsi.laut) S.tabung(0, -45, 0, 50, 40, 'laut', 32, 56);
  const c = {
    S, isi, khusus, st: {},
    gerak(fn, parent = isi) { const R = new Rakit(); fn(R); const m = R.bangun(bahan); meshes.push(m); const p = new THREE.Group(); p.add(m); parent.add(p); return p; },
    titik(parent, pos) { const o = new THREE.Object3D(); o.position.set(...pos); (parent || isi).add(o); return o; },
    kepul(anchor, o) { emit.push({ per: 3.2, n: 5, naik: 30, geser: 8, r: 2.6, fase: 0, ...o, anchor, warna: new Color(o.warna || '#D2D0CC') }); },
    air(w, d, x, y, z, sx, sz) {
      const R = new Rakit(); R.geo(new THREE.PlaneGeometry(w, d, sx, sz).rotateX(-Math.PI / 2), 'air', M(x, y, z));
      const m = R.bangun(bahan); m.castShadow = false; meshes.push(m); isi.add(m);
      ombak.push({ m, dasar: m.geometry.attributes.position.array.slice(), f: (X, Y, Z, t) => [X, Y + 0.45 * Math.sin(X * 0.45 + t * 2.1) * Math.cos(Z * 0.38 + t * 1.6), Z] });
      return m;
    },
    bendera(x, y, z, w, h) {
      [['aksen', 0], ['putih', -h / 2]].forEach(([warna, dy]) => {
        const R = new Rakit(); R.geo(new THREE.PlaneGeometry(w, h / 2, 8, 1).translate(w / 2, -h / 4 + dy, 0), warna, M(x, y, z));
        const m = R.bangun(bahan); meshes.push(m); isi.add(m);
        ombak.push({ m, dasar: m.geometry.attributes.position.array.slice(), f: (X, Y, Z, t) => { const u = X - x; return [X - Math.abs(Math.sin(u * 0.5 - t * 6)) * u * 0.03, Y + Math.sin(u * 0.4 - t * 5) * u * 0.04, Z + Math.sin(u * 0.55 - t * 7) * u * 0.14]; } });
      });
    },
  };
  const a = ADEGAN[ikon] ? ADEGAN[ikon](c) : { tinggi: 20, gerak() {} };
  const statis = S.bangun(bahan);
  meshes.push(statis);
  isi.add(statis);
  const sc = {
    ikon, root, isi, meshes, khusus, bahan, tinggi: a.tinggi,
    update(t) {
      a.gerak(t);
      ombak.forEach(({ m, dasar, f }) => {
        const p = m.geometry.attributes.position, arr = p.array;
        for (let i = 0; i < arr.length; i += 3) { const r = f(dasar[i], dasar[i + 1], dasar[i + 2], t); arr[i] = r[0]; arr[i + 1] = r[1]; arr[i + 2] = r[2]; }
        p.needsUpdate = true;
        m.geometry.computeVertexNormals();
      });
      sc._t = t;
    },
    kepul(kp) { // partikel di koordinat dunia
      const ws = root.scale.x * isi.scale.x, t = sc._t || 0;
      emit.forEach((e) => {
        if (e.aktif && !e.aktif()) return;
        e.anchor.getWorldPosition(_w);
        for (let i = 0; i < e.n; i++) {
          const age = fr(t / e.per + i / e.n + e.fase + (e.mancur ? 0 : Math.sin(i * 12.9898) * 0.04));
          if (e.mancur) {
            const ang = i * 2.4, v = 4 + (i % 3);
            kp.tambah(_w.x + Math.cos(ang) * v * age * ws, _w.y + 7 * 4 * age * (1 - age) * ws, _w.z + Math.sin(ang) * v * age * ws, e.r * ws, e.warna);
          } else {
            const r = e.r * (0.45 + 1.25 * age) * Math.pow(1 - age, 0.6) * Math.min(1, age * 6);
            const jx = Math.sin(i * 2.7 + t * 0.9) * e.r * 0.55 * age, jz = Math.cos(i * 1.9 + t * 0.7) * e.r * 0.45 * age; // goyang agar tak berderet seperti manik
            kp.tambah(_w.x + (e.geser * age + jx) * ws, _w.y + e.naik * age * ws, _w.z + (jz - e.geser * 0.35 * age) * ws, r * ws, e.warna);
          }
        }
      });
    },
    buang() {
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== bahan) o.material.dispose(); });
      bahan.dispose();
    },
  };
  sc.update(0);
  return sc;
}

// ---------- ikon daftar: render kecil tiap adegan sekali (konteks WebGL terpisah, lalu dilepas) ----------
export function buatIkon(daftar) {
  const UK = 72;
  const kanvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(UK, UK, false);
  const sc3 = new THREE.Scene();
  sc3.add(new THREE.HemisphereLight(0xffffff, 0xd9d6d0, 1.55));
  const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(-380, 820, 330); sc3.add(d);
  const cam = new THREE.OrthographicCamera(-54, 54, 66, -42, 1, 4000);
  const a = -8 * Math.PI / 180, sq = 0.66, ce = Math.sqrt(1 - sq * sq);
  cam.up.set(-sq * Math.sin(a), ce, -sq * Math.cos(a));
  cam.position.set(Math.sin(a) * ce * 1000, sq * 1000 + 6, Math.cos(a) * ce * 1000);
  cam.lookAt(0, 6, 0);
  const hasil = {};
  daftar.forEach((ikon) => {
    const sc = buatAdegan(ikon, { ikon: true });
    warnai(sc, 'c2', false);
    sc.update(1.3);
    sc3.add(sc.root);
    r.render(sc3, cam);
    hasil[ikon] = kanvas.toDataURL('image/png');
    sc3.remove(sc.root);
    sc.buang();
  });
  r.dispose();
  r.forceContextLoss();
  return hasil;
}
