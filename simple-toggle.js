(() => {
  const addCss = (href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  addCss('mobile-fix.css?v=1');
  addCss('simple-mode.css?v=2');

  document.querySelectorAll('h1, h2, h3').forEach((heading) => {
    heading.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent = child.textContent.replace(/[.。]+\s*$/g, '');
      }
    });
  });

  if (document.querySelector('.simple-toggle')) return;

  const button = document.createElement('button');
  button.className = 'simple-toggle';
  button.type = 'button';
  button.innerHTML = '<span class="simple-toggle__dot"></span><span class="simple-toggle__label"></span>';
  document.body.appendChild(button);

  const label = button.querySelector('.simple-toggle__label');
  const saved = window.localStorage.getItem('t8pium-simple-mode') === '1';
  document.documentElement.classList.toggle('simple-mode', saved);

  const sync = () => {
    const on = document.documentElement.classList.contains('simple-mode');
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Current mode: simple. Tap for full mode.' : 'Current mode: full. Tap for simple mode.');
    label.textContent = on ? 'Mode: Simple' : 'Mode: Full';
  };

  button.addEventListener('click', () => {
    const on = !document.documentElement.classList.contains('simple-mode');
    document.documentElement.classList.toggle('simple-mode', on);
    window.localStorage.setItem('t8pium-simple-mode', on ? '1' : '0');
    sync();
  });

  sync();
})();
