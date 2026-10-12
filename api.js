// データの読み書き（Google Apps Script の JSON API を呼ぶ）
const API_URL = 'https://script.google.com/macros/s/AKfycbzBGQYEsoGpGgVEw_quuisdGvJvje-AqTDol7TsdjhZgfWNsJDd6_7E1ENN7tv4ibuKsw/exec';
const KEY_NAME = 'dietKey';

// 合言葉（キー）は初回だけ URL の #k=... で受け取り、この端末に保存する
function apiKey() {
  const m = location.hash.match(/k=([0-9a-f]+)/);
  if (m) {
    try { localStorage.setItem(KEY_NAME, m[1]); } catch (e) {}
    history.replaceState(null, '', location.pathname);
    return m[1];
  }
  try { return localStorage.getItem(KEY_NAME); } catch (e) { return null; }
}

async function call(fn, ...args) {
  // プレビュー用：google.script.run の代わりの偽物があればそれを使う
  if (window.google && google.script && google.script.run) {
    return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej)[fn](...args));
  }
  const key = apiKey();
  if (!key) throw new Error('この端末にはまだ合言葉が登録されていません。最初に案内したリンク（#k= 付き）から一度開いてください。');
  // text/plain で送ると CORS の事前確認が不要になる
  const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ key, fn, args }) });
  const j = await res.json();
  if (!j.ok) {
    if (/キー/.test(j.error)) { try { localStorage.removeItem(KEY_NAME); } catch (e) {} }
    throw new Error(j.error);
  }
  return j.data;
}
