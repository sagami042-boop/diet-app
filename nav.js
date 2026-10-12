// PC（横幅900px以上）だけに出す左側のメニュー。スマホでは表示しない
(function () {
  const page = location.pathname.endsWith('dash.html') ? 'dash'
    : new URLSearchParams(location.search).get('view') === 'foods' ? 'foods' : 'log';
  const icon = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const items = [
    ['log', 'index.html', '今日の記録', icon('<path d="M4 6h16M4 12h16M4 18h10"/>')],
    ['dash', 'dash.html', 'ダッシュボード', icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')],
    ['foods', 'index.html?view=foods', '食品リスト', icon('<path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>')],
  ];
  const css = `
    .side-nav { display: none; }
    @media (min-width: 900px) {
      body { padding-left: 232px; }
      .side-nav { display: flex; flex-direction: column; position: fixed; left: 0; top: 0; bottom: 0; width: 232px; padding: 22px 14px;
        background: #2b231e; color: #e9ddd3; z-index: 5; }
      .side-nav .logo { font-size: 22px; font-weight: 700; color: #fff; padding: 0 10px; display: flex; align-items: center; gap: 10px; }
      .side-nav .logo img { width: 30px; height: 30px; border-radius: 8px; }
      .side-nav .logo small { font-size: 11px; font-weight: 400; color: #a8968a; }
      .side-nav nav { margin-top: 26px; display: flex; flex-direction: column; gap: 4px; }
      .side-nav a { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; color: #e9ddd3; text-decoration: none; font-size: 15px; }
      .side-nav a:hover { background: rgba(255,255,255,0.06); }
      .side-nav a.on { background: rgba(255,255,255,0.11); color: #fff; font-weight: 600; }
      .side-nav .foot { margin-top: auto; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.06); font-size: 12px; color: #a8968a; line-height: 1.6; }
      .side-nav .foot b { color: #fff; font-size: 14px; }
      .pc-hide { display: none !important; }
    }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const el = document.createElement('aside');
  el.className = 'side-nav';
  el.innerHTML = `<div class="logo"><img src="icon.png" alt="">ダイエット<small>diet</small></div>
    <nav>${items.map(([k, href, label, ic]) => `<a href="${href}" class="${k === page ? 'on' : ''}">${ic}${label}</a>`).join('')}</nav>
    <div class="foot" id="nav-goal"></div>`;
  // 画面側から目標などを表示してもらう（メニューを置く前に呼ばれても、置いた時点で反映する）
  let goal = '';
  window.setNavGoal = html => { goal = html; const g = document.getElementById('nav-goal'); if (g) g.innerHTML = html; };
  document.addEventListener('DOMContentLoaded', () => { document.body.prepend(el); el.querySelector('#nav-goal').innerHTML = goal; });
})();
