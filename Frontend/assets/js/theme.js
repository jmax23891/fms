(() => {
  const root = document.documentElement;
  const key = 'sfs-theme';
  const current = () => root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const apply = (theme, persist = true) => {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try { localStorage.setItem(key, theme); } catch (_) {}
    }
    document.querySelectorAll('.theme-toggle').forEach((button) => {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      button.innerHTML = dark ? '<span aria-hidden="true">☀</span><span>Light mode</span>' : '<span aria-hidden="true">☾</span><span>Dark mode</span>';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#090C08' : '#FFFFFF');
  };
  function addToggle() {
    if (document.querySelector('.theme-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.addEventListener('click', () => apply(current() === 'dark' ? 'light' : 'dark'));
    const target = document.querySelector('.topbar-right') || document.querySelector('.auth-brand') || document.querySelector('.auth-brand');
    if (target) {
      if (target.classList.contains('topbar-right')) {
        const install = target.querySelector('#install-btn');
        if (install) target.insertBefore(button, install);
        else target.prepend(button);
      } else target.appendChild(button);
    } else {
      button.style.position = 'fixed'; button.style.right = '16px'; button.style.top = '16px'; button.style.zIndex = '1000';
      document.body.appendChild(button);
    }
    apply(current(), false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addToggle, { once: true });
  else addToggle();
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') apply(saved, false);
  } catch (_) {}
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', (event) => {
    let saved = null; try { saved = localStorage.getItem(key); } catch (_) {}
    if (!saved) apply(event.matches ? 'dark' : 'light', false);
  });
})();
