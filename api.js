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

// 前回の結果をこの端末に覚えておき、開いた瞬間はそれで表示する（最新は裏で取り直す）
const CACHE = 'diet-cache:';
function cacheGet(k) { try { return JSON.parse(localStorage.getItem(CACHE + k)); } catch (e) { return null; } }
function cacheSet(k, v) { try { localStorage.setItem(CACHE + k, JSON.stringify(v)); } catch (e) {} }

let inflight = 0; // 通信中の数（通信中は新しい版への切り替えをしない）
async function call(fn, ...args) {
  // プレビュー用：google.script.run の代わりの偽物があればそれを使う
  if (window.google && google.script && google.script.run) {
    return new Promise((res, rej) => google.script.run.withSuccessHandler(res).withFailureHandler(rej)[fn](...args));
  }
  const key = apiKey();
  if (!key) throw new Error('合言葉が入力されていません。ページを開き直して入力してください。');
  // text/plain で送ると CORS の事前確認が不要になる。通信が一瞬切れた場合に備えて、読み込みは2回まで再試行
  // データを書き換えない処理（読み込み・写真や文章の読み取り）は、通信が切れたら2回までやり直す
  const body = JSON.stringify({ key, fn, args }), safe = /^(getInit|getDay|getDashboard|getRunning|readLabel|readRunShots|parseMeal|parseMealPhotos)$/.test(fn);
  let res;
  inflight++;
  try {
    for (let i = 0; ; i++) {
      try { res = await fetch(API_URL, { method: 'POST', body }); break; }
      catch (e) {
        if (!safe || i >= 2) throw new Error('通信できませんでした。電波の良い場所でもう一度試してください（' + (e.message || e) + '）');
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  } finally { inflight--; }
  const j = await res.json();
  if (!j.ok) {
    if (/キー/.test(j.error)) { try { localStorage.removeItem(KEY_NAME); } catch (e) {} }
    throw new Error(j.error);
  }
  return j.data;
}

// 新しい版が公開されていたら自動で読み込み直す（GitHub Pages は最大10分キャッシュするため）
async function checkUpdate() {
  if (typeof APP_VERSION === 'undefined' || inflight > 0 || (typeof S !== 'undefined' && (S.dirty || S.sending))) return;
  try {
    const t = await (await fetch(location.pathname + '?nc=' + Date.now(), { cache: 'no-store' })).text();
    const v = (t.match(/APP_VERSION = '([^']+)'/) || [])[1];
    if (v && v !== APP_VERSION) location.replace(location.pathname + '?v=' + v + location.hash);
  } catch (e) {}
}
checkUpdate();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });
