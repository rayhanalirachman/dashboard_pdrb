// Runs each artboard's logic class against data.json and asserts holes are filled.
// node check.js data.json file1.dc.html [file2 ...]
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const f of process.argv.slice(3)) {
  const html = fs.readFileSync(f, 'utf8');
  const js = html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1];
  const tpl = html.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  class DCLogic { constructor(p) { this.props = p || {}; } setState(o) { this.state = { ...this.state, ...o }; } }
  const Component = new Function('DCLogic', 'fetch', js + '\nreturn Component;')(DCLogic, () => new Promise(() => {}));
  const c = new Component({});
  c.renderVals(); // loading state must not throw
  c.state.data = data;
  for (const st of [{}, { tahun: '2024' }, { harga: 'konstan' }, { hover: 'Papua Pegunungan' }, { pilih: 'E' }]) {
    c.setState(st);
    const v = c.renderVals();
    // every top-level hole name used in the template must exist
    for (const m of tpl.matchAll(/\{\{\s*([a-zA-Z_$][\w$]*)/g)) {
      const name = m[1];
      if (['true', 'false'].includes(name)) continue;
      const loopVar = new RegExp('as="' + name + '"').test(tpl);
      if (!loopVar && !(name in v)) throw new Error(f + ': missing hole ' + name);
    }
    for (const [k, x] of Object.entries(v)) if (Array.isArray(x)) x.forEach((it) => { if (it && typeof it === 'object') for (const [kk, vv] of Object.entries(it)) if (vv === undefined || (typeof vv === 'string' && /NaN|undefined/.test(vv))) throw new Error(f + ': bad ' + k + '.' + kk + '=' + vv); });
  }
  const v = c.renderVals();
  console.log('ok', f.split('/').pop(), Object.keys(v).filter((k) => Array.isArray(v[k])).map((k) => k + ':' + v[k].length).join(' '));
}
