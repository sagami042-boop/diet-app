// データの読み書き（Google Apps Script の JSON API を呼ぶ）
const API_URL = 'https://script.google.com/macros/s/AKfycbzBGQYEsoGpGgVEw_quuisdGvJvje-AqTDol7TsdjhZgfWNsJDd6_7E1ENN7tv4ibuKsw/exec';
const KEY_NAME = 'dietKey';

// 合言葉（キー）は URL の #k=... で受け取り、この端末にも保存する。
// iPhoneのホーム画面アプリはSafariと保存領域が別なので、#k= はURLに残したままにする
// （ホーム画面に追加したときのURLに合言葉が含まれ、起動のたびに読める）
function apiKey() {
  const m = location.hash.match(/k=([0-9a-f]+)/);
  if (m) {
    try { localStorage.setItem(KEY_NAME, m[1]); } catch (e) {}
    return m[1];
  }
  let k = null;
  try { k = localStorage.getItem(KEY_NAME); } catch (e) {}
  if (!k) {
    k = (prompt('合言葉を入力してください（最初に案内したリンクの「#k=」より後ろの英数字）') || '').trim().replace(/^.*k=/, '');
    if (k) { try { localStorage.setItem(KEY_NAME, k); } catch (e) {} }
  }
  if (k && !m) history.replaceState(null, '', location.pathname + '#k=' + k);
  return k || null;
}

// 画面間の移動でも合言葉を引き継ぐ
document.addEventListener('click', e => {
  const a = e.target.closest('a[href$=".html"]');
  if (a && location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash);
});

async function call(fn, ...args) {
  // プレビュー用：google.script.run の代わりの偽物があればそれを使う
  if (window.google && google.script && google.script.run) {
    return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej)[fn](...args));
  }
  const key = apiKey();
  if (!key) throw new Error('合言葉が入力されていません。ページを開き直して入力してください。');
  // text/plain で送ると CORS の事前確認が不要になる
  const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ key, fn, args }) });
  const j = await res.json();
  if (!j.ok) {
    if (/キー/.test(j.error)) { try { localStorage.removeItem(KEY_NAME); } catch (e) {} }
    throw new Error(j.error);
  }
  return j.data;
}
