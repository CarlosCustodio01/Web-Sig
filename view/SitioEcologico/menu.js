(function () {
  const TRANSITION_MS = 650; // deve bater com a transição do CSS

  const sidebar = document.getElementById('sidebarMenu');
  const container = document.querySelector('.conteiner');
  const toggle = document.getElementById('menuToggle');

  function getFocusable(el) {
    if (!el) return [];
    return Array.from(el.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])'))
      .filter(node => !node.hasAttribute('disabled') && node.offsetParent !== null);
  }

  let focusableEls = [];
  let firstFocusable = null;
  let lastFocusable = null;
  let previouslyFocused = null;
  let keydownHandler = null;

  function forceMapRedrawDelay() {
    if (typeof map !== 'undefined' && typeof map.invalidateSize === 'function') {
      setTimeout(() => map.invalidateSize(), TRANSITION_MS + 50);
    }
  }

  function openSidebar() {
    if (!sidebar || !container || !toggle) return;
    previouslyFocused = document.activeElement;
    sidebar.classList.add('open');
    container.classList.add('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');

    focusableEls = getFocusable(sidebar);
    firstFocusable = focusableEls[0] || sidebar;
    lastFocusable = focusableEls[focusableEls.length - 1] || sidebar;

    setTimeout(() => firstFocusable.focus(), 80);

    keydownHandler = function (e) {
      if (e.key === 'Tab') {
        if (focusableEls.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable || document.activeElement === sidebar) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (e.key === 'Escape') {
        closeSidebar();
      }
    };
    document.addEventListener('keydown', keydownHandler);

    forceMapRedrawDelay();
  }

  function closeSidebar() {
    if (!sidebar || !container || !toggle) return;
    sidebar.classList.remove('open');
    container.classList.remove('sidebar-open');
    sidebar.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');

    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }

    setTimeout(() => {
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      } else if (toggle) {
        toggle.focus();
      }
    }, 80);

    forceMapRedrawDelay();
  }

  window.toggleMenu = function () {
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) closeSidebar();
    else openSidebar();
  };

  document.addEventListener('click', function (e) {
    if (!sidebar || !container) return;
    const isOpen = sidebar.classList.contains('open');
    if (!isOpen) return;
    if (!e.target.closest('.sidebar') && !e.target.closest('.menu-toggle') && !e.target.closest('#menuToggle')) {
      closeSidebar();
    }
  });

  // redraw no resize / orientationchange
  window.addEventListener('resize', () => {
    if (typeof map !== 'undefined' && typeof map.invalidateSize === 'function') {
      setTimeout(() => map.invalidateSize(), 300);
    }
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (typeof map !== 'undefined' && typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
    }, TRANSITION_MS + 80);
  });

  // estados iniciais
  if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');

})();