(() => {
  const kill = () => {
    document.documentElement.classList.remove('simple-mode');
    document.querySelectorAll('.simple-toggle').forEach((node) => node.remove());
    try { window.localStorage.removeItem('t8pium-simple-mode'); } catch (error) {}
  };

  kill();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', kill, { once: true });
  }
  setTimeout(kill, 50);
  setTimeout(kill, 250);
  setTimeout(kill, 1000);
})();
