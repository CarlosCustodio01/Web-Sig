(function () {
  window.toggleMenu = function () {
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.conteiner');
    if (!sidebar || !container) return;

    const isOpen = sidebar.classList.toggle('open');
    container.classList.toggle('sidebar-open', isOpen);

    if (window.innerWidth <= 800) {
      container.classList.toggle('overlay-shown', isOpen);
    } else {
      container.classList.remove('overlay-shown');
    }

    if (typeof map !== 'undefined' && typeof map.invalidateSize === 'function') {
      setTimeout(() => map.invalidateSize(), 300);
    }
  };

  // fecha ao clicar fora (mobile)
  document.addEventListener('click', function (e) {
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.conteiner');
    if (!sidebar || !container) return;
    if (window.innerWidth <= 800 && sidebar.classList.contains('open')) {
      if (!e.target.closest('.sidebar') && !e.target.closest('.menu-toggle')) {
        sidebar.classList.remove('open');
        container.classList.remove('overlay-shown', true);
        container.classList.remove('sidebar-open');
        if (typeof map !== 'undefined' && typeof map.invalidateSize === 'function') {
          setTimeout(() => map.invalidateSize(), 300);
        }
      }
    }
  });

  // ESC fecha
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const sidebar = document.querySelector('.sidebar');
      const container = document.querySelector('.conteiner');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        container.classList.remove('overlay-shown', true);
        container.classList.remove('sidebar-open');
      }
    }
  });
})();