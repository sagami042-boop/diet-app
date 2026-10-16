// PC（横幅900px以上）だけに出す左側のメニュー。スマホでは表示しない
(function () {
  const page = location.pathname.endsWith('dash.html') ? 'dash' : location.pathname.endsWith('foods.html') ? 'foods' : 'log';
  const icon = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const items = [
    ['log', 'index.html', '今日の記録', icon('<path d="M4 6h16M4 12h16M4 18h10"/>')],
    ['dash', 'dash.html', 'ダッシュボード', icon('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')],
    ['foods', 'foods.html', '食品リスト', icon('<path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h3"/>')],
  ];
  const css = `
    .side-nav { display: none; }
    /* スマホ：右上のハンバーガーボタンと、右から出るメニュー */
    .nav-burger { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px;
      background: var(--card); color: var(--text); flex: none; }
    .m-nav { position: fixed; inset: 0; z-index: 30; pointer-events: none; }
    .m-nav .ov { position: absolute; inset: 0; background: rgba(20,12,8,0.4); opacity: 0; transition: opacity .2s; }
    .m-nav .pn { position: absolute; top: 0; right: 0; bottom: 0; width: min(280px, 80vw); background: #2b231e; color: #e9ddd3;
      padding: calc(20px + env(safe-area-inset-top)) 14px calc(20px + env(safe-area-inset-bottom)); display: flex; flex-direction: column;
      transform: translateX(100%); transition: transform .22s ease; }
    .m-nav.open { pointer-events: auto; }
    .m-nav.open .ov { opacity: 1; }
    .m-nav.open .pn { transform: none; }
    .m-nav .logo { font-size: 20px; font-weight: 700; color: #fff; padding: 0 10px; display: flex; align-items: center; gap: 10px; }
    .m-nav .logo img { width: 28px; height: 28px; border-radius: 8px; }
    .m-nav nav { margin-top: 22px; display: flex; flex-direction: column; gap: 4px; }
    .m-nav a { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border-radius: 10px; color: #e9ddd3; text-decoration: none; font-size: 16px; }
    .m-nav a.on { background: rgba(255,255,255,0.11); color: #fff; font-weight: 600; }
    .m-nav .foot { margin-top: auto; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.06); font-size: 12px; color: #a8968a; line-height: 1.6; }
    .m-nav .foot b { color: #fff; font-size: 14px; }
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
      .pc-hide, .nav-burger, .m-nav { display: none !important; }
    }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const el = document.createElement('aside');
  el.className = 'side-nav';
  el.innerHTML = `<div class="logo"><img src="icon.png" alt="">体型管理<small>body</small></div>
    <nav>${items.map(([k, href, label, ic]) => `<a href="${href}" class="${k === page ? 'on' : ''}">${ic}${label}</a>`).join('')}</nav>
    <div class="foot" id="nav-goal"></div>`;
  const links = items.map(([k, href, label, ic]) => `<a href="${href}" class="${k === page ? 'on' : ''}">${ic}${label}</a>`).join('');
  const mob = document.createElement('div');
  mob.className = 'm-nav';
  mob.innerHTML = `<div class="ov" onclick="closeNav()"></div><div class="pn">
    <div class="logo"><img src="icon.png" alt="">体型管理</div><nav>${links}</nav><div class="foot nav-goal"></div></div>`;
  window.openNav = () => mob.classList.add('open');
  window.closeNav = () => mob.classList.remove('open');
  // 各ページのヘッダーに置くボタン
  window.NAV_BURGER = `<button class="nav-burger" onclick="openNav()" aria-label="メニューを開く"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`;

  // 画面側から目標などを表示してもらう（メニューを置く前に呼ばれても、置いた時点で反映する）
  let goal = '';
  const paint = () => document.querySelectorAll('#nav-goal, .nav-goal').forEach(g => { g.innerHTML = goal; });
  window.setNavGoal = html => { goal = html; paint(); };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.prepend(el); document.body.append(mob); paint();
    document.querySelectorAll('[data-burger]').forEach(x => { x.outerHTML = NAV_BURGER; });
  });
})();
