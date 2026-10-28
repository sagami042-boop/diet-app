// PC（横幅900px以上）は左側のメニュー、スマホは画面下のアイコンメニュー
(function () {
  const path = location.pathname;
  const page = path.endsWith('dash.html') ? 'dash' : path.endsWith('foods.html') ? 'foods' : path.endsWith('run.html') ? 'run' : 'log';
  const icon = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const items = [
    ['log', 'index.html', '今日の記録', icon('<path d="M4 6h16M4 12h16M4 18h10"/>')],
    ['dash', 'dash.html', 'ダッシュボード', icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')],
    ['run', 'run.html', 'ランニング', icon('<circle cx="14" cy="4.5" r="2"/><path d="M6 20l3.5-5 3 2.5L14 13l3 3h3M9 11l3-3 3 2 2-1"/>')],
    ['foods', 'foods.html', '食品リスト', icon('<path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>')],
  ];
  const css = `
    .side-nav { display: none; }
    /* スマホ：画面下に並べるアイコンのメニュー */
    .tab-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 8; display: flex; background: var(--card); border-top: 1px solid var(--line);
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); }
    .tab-bar a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 4px 0; color: var(--sub);
      text-decoration: none; font-size: 10.5px; font-weight: 500; }
    .tab-bar a svg { width: 24px; height: 24px; }
    .tab-bar a.on { color: var(--accent); font-weight: 700; }
    body { padding-bottom: calc(64px + env(safe-area-inset-bottom)); }
    .toast { bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
    @media (min-width: 900px) {
      body { padding-left: 232px; }
      .side-nav { display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; width: 232px; padding: 22px 14px;
        background: #14212c; color: #dbe5ec; z-index: 5; }
      .side-nav .logo { font-size: 22px; font-weight: 700; color: #fff; padding: 0 10px; display: flex; align-items: center; gap: 10px; }
      .side-nav .logo img { width: 30px; height: 30px; border-radius: 8px; }
      .side-nav .logo small { font-size: 11px; font-weight: 400; color: #8a9aa7; }
      .side-nav nav { margin-top: 26px; display: flex; flex-direction: column; gap: 4px; }
      .side-nav a { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; color: #dbe5ec; text-decoration: none; font-size: 15px; }
      .side-nav a:hover { background: rgba(255,255,255,0.06); }
      .side-nav a.on { background: rgba(255,255,255,0.11); color: #fff; font-weight: 600; }
      .side-nav .foot { margin-top: auto; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.06); font-size: 12px; color: #8a9aa7; line-height: 1.6; }
      .side-nav .foot b { color: #fff; font-size: 14px; }
      body { padding-bottom: 0; }
      .pc-hide, .tab-bar { display: none !important; }
    }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const el = document.createElement('aside');
  el.className = 'side-nav';
  el.innerHTML = `<div class="logo"><img src="icon.png" alt="">体型管理<small>body</small></div>
    <nav>${items.map(([k, href, label, ic]) => `<a href="${href}" class="${k === page ? 'on' : ''}">${ic}${label}</a>`).join('')}</nav>
    <div class="foot" id="nav-goal"></div>`;
  const bar = document.createElement('nav');
  bar.className = 'tab-bar';
  bar.innerHTML = items.map(([k, href, label, ic]) => `<a href="${href}" class="${k === page ? 'on' : ''}">${ic}${label}</a>`).join('');
  window.NAV_BURGER = ''; // 以前の右上メニューボタン（下のメニューに置き換えたので空）

  // 画面側から目標などを表示してもらう（メニューを置く前に呼ばれても、置いた時点で反映する）
  let goal = '';
  const paint = () => document.querySelectorAll('#nav-goal, .nav-goal').forEach(g => { g.innerHTML = goal; });
  window.setNavGoal = html => { goal = html; paint(); };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(el); document.body.append(bar); paint();
    document.querySelectorAll('[data-burger]').forEach(x => x.remove());
  });
})();
