// Garmin などの走行データ（.fit / .fit を含む .zip）をブラウザの中で読み取る。
// 外部ライブラリは使わず、必要なメッセージ（session・lap）だけを取り出す。
(function () {
  const FIT_EPOCH = 631065600; // FIT の時刻は 1989-12-31 起点の秒

  // 基本型ごとの大きさ・読み方・無効値
  const BASE = {
    0x00: [1, 'u8', 0xFF], 0x01: [1, 's8', 0x7F], 0x02: [1, 'u8', 0xFF], 0x07: [1, 'str', null],
    0x0A: [1, 'u8', 0], 0x0D: [1, 'u8', 0xFF],
    0x83: [2, 's16', 0x7FFF], 0x84: [2, 'u16', 0xFFFF], 0x8B: [2, 'u16', 0],
    0x85: [4, 's32', 0x7FFFFFFF], 0x86: [4, 'u32', 0xFFFFFFFF], 0x8C: [4, 'u32', 0],
    0x88: [4, 'f32', null], 0x89: [8, 'f64', null], 0x8E: [8, 's64', null], 0x8F: [8, 'u64', null], 0x90: [8, 'u64', 0],
  };

  function readVal(dv, pos, size, type, little) {
    const t = BASE[type] || [1, 'u8', null];
    if (t[1] === 'str') return null;
    if (size < t[0]) return null;
    let v;
    switch (t[1]) {
      case 'u8': v = dv.getUint8(pos); break;
      case 's8': v = dv.getInt8(pos); break;
      case 'u16': v = dv.getUint16(pos, little); break;
      case 's16': v = dv.getInt16(pos, little); break;
      case 'u32': v = dv.getUint32(pos, little); break;
      case 's32': v = dv.getInt32(pos, little); break;
      case 'f32': v = dv.getFloat32(pos, little); break;
      case 'f64': v = dv.getFloat64(pos, little); break;
      default: return null; // 64bit整数は使わない
    }
    return v === t[2] ? null : v;
  }

  // FIT をメッセージ番号ごとの配列（フィールド番号 → 値）にする
  function parseFit(buf) {
    const dv = new DataView(buf);
    const hsize = dv.getUint8(0);
    if (String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11)) !== '.FIT') throw new Error('FITファイルではありません');
    const end = Math.min(hsize + dv.getUint32(4, true), buf.byteLength);
    const defs = {}, out = {};
    let pos = hsize;
    while (pos < end) {
      const h = dv.getUint8(pos++);
      if (h & 0x80) { // 時刻を省略した形式のデータ
        const def = defs[(h >> 5) & 0x03];
        if (!def) throw new Error('FITの形式が読めません');
        pos = readData(dv, pos, def, out);
      } else if (h & 0x40) { // 定義
        const local = h & 0x0F, dev = h & 0x20;
        pos += 1; // 予約
        const little = dv.getUint8(pos++) === 0;
        const num = dv.getUint16(pos, little); pos += 2;
        const n = dv.getUint8(pos++), fields = [];
        for (let i = 0; i < n; i++, pos += 3) fields.push([dv.getUint8(pos), dv.getUint8(pos + 1), dv.getUint8(pos + 2)]);
        let devSize = 0;
        if (dev) { const dn = dv.getUint8(pos++); for (let i = 0; i < dn; i++, pos += 3) devSize += dv.getUint8(pos + 1); }
        defs[local] = { num, little, fields, devSize };
      } else { // データ
        const def = defs[h & 0x0F];
        if (!def) throw new Error('FITの形式が読めません');
        pos = readData(dv, pos, def, out);
      }
    }
    return out;
  }

  const KEEP = { 0: 1, 18: 1, 19: 1 }; // file_id・session・lap だけ取り出す（1秒ごとの記録は使わない）
  function readData(dv, pos, def, out) {
    if (KEEP[def.num]) {
      const m = {};
      let p = pos;
      def.fields.forEach(([f, size, type]) => { m[f] = readVal(dv, p, size, type, def.little); p += size; });
      (out[def.num] = out[def.num] || []).push(m);
    }
    return pos + def.fields.reduce((a, f) => a + f[1], 0) + def.devSize;
  }

  // .zip の中から .fit を取り出す（中央ディレクトリを読んで、圧縮は deflate のみ対応）
  async function unzipFits(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('zipファイルが読めません');
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = [];
    for (let i = 0; i < count; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
      p += 46 + nlen + xlen + clen;
      if (!/\.fit$/i.test(name)) continue;
      const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const data = u8.slice(start, start + csize);
      if (method === 0) files.push(data.buffer);
      else if (method === 8) {
        const s = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        files.push(await new Response(s).arrayBuffer());
      }
    }
    if (!files.length) throw new Error('zipの中にFITファイルがありません');
    return files;
  }

  const round = (v, d = 0) => v == null ? null : Math.round(v * 10 ** d) / 10 ** d;
  const div = (v, s) => v == null ? null : v / s;
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  // アプリの走行記録の形にする
  function toRun(msgs) {
    const s = (msgs[18] || [])[0];
    if (!s) throw new Error('走行のまとめ（session）が見つかりません');
    if (s[5] != null && s[5] !== 1) throw new Error('ランニングの記録ではないようです');
    const start = new Date((s[2] + FIT_EPOCH) * 1000);
    const km = div(s[9], 100000), sec = div(s[8], 1000);
    const spm = (c, frac) => c == null ? null : Math.round((c + (frac ? frac / 128 : 0)) * 2); // 片足の回数×2＝歩数/分
    const laps = (msgs[19] || []).map(l => {
      const lk = div(l[9], 100000), lt = div(l[8], 1000);
      return {
        km: round(lk, 2), pace: lk ? Math.round(lt / lk) : 0, elev: (l[21] || 0) - (l[22] || 0),
        hr: l[15], hrMax: l[16], cadence: spm(l[17], l[80]), power: l[19],
        vo: round(div(l[77], 100), 1), gct: round(div(l[79], 10)), stepLen: round(div(l[120], 10000), 2),
      };
    }).filter(l => l.km > 0.05);
    const full = laps.filter(l => l.km >= 0.5);
    return {
      date: ymd(start), km: round(km, 2), sec: Math.round(sec), hr: s[16] || null, memo: '', type: '練習',
      detail: {
        source: 'garmin', start: hm(start), elapsed: Math.round(div(s[7], 1000)),
        best: full.length ? Math.min(...full.map(l => l.pace)) : 0,
        kcal: s[11], cadence: spm(s[18], s[92]), up: s[22] || 0, down: s[23] || 0, hrMax: s[17] || 0,
        power: s[20], np: s[34], vo: round(div(s[89], 100), 1), gct: round(div(s[91], 10)), vr: round(div(s[132], 100), 1),
        stepLen: round(div(s[134], 10000), 2), te: round(div(s[24], 10), 1), teAn: round(div(s[137], 10), 1),
        temp: s[57], splits: laps,
      },
    };
  }

  // File（.fit / .zip）を読み取って走行記録の配列にする
  window.readGarminFile = async function (file) {
    const buf = await file.arrayBuffer();
    const head = new Uint8Array(buf, 0, 4);
    const fits = head[0] === 0x50 && head[1] === 0x4B ? await unzipFits(buf) : [buf];
    return fits.map(b => toRun(parseFit(b)));
  };
  window._fitInternals = { parseFit, toRun, unzipFits }; // 動作確認用
})();
