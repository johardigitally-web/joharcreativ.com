/* Mega-menu hover intent.
   The trigger is a narrow box; the panel below spans the full header width.
   Travelling diagonally to a left-column item leaves the trigger before
   reaching the panel, so a pure :hover rule closes the menu mid-journey.
   Keep it open briefly after the pointer leaves, and cancel if it returns. */
(function () {
  'use strict';

  // 260 was inside the time a deliberate pointer takes to cross the header and
  // reach a menu item, and once the panel hides mid-journey it cannot recover:
  // the panel is display:none, so the pointer lands on page content and no
  // mouseenter fires to cancel the close. 400 still reads as instant.
  var CLOSE_DELAY = 400;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var groups = [].slice.call(document.querySelectorAll('.has-drop'));
    if (!groups.length) return;

    document.documentElement.classList.add('js-nav');

    groups.forEach(function (g) {
      var timer = null;

      function open() {
        clearTimeout(timer);
        groups.forEach(function (o) { if (o !== g) o.classList.remove('is-open'); });
        g.classList.add('is-open');
      }

      function close(now) {
        clearTimeout(timer);
        if (now) { g.classList.remove('is-open'); return; }
        timer = setTimeout(function () { g.classList.remove('is-open'); }, CLOSE_DELAY);
      }

      g.addEventListener('mouseenter', function () { if (window.innerWidth > 900) open(); });
      g.addEventListener('mouseleave', function () { if (window.innerWidth > 900) close(false); });
      // focusin fires BEFORE click. Below 900px that would mark the group open
      // before the mobile tap handler runs, which then reads it as "already
      // open" and lets the parent link navigate instead of revealing children.
      g.addEventListener('focusin', function () { if (window.innerWidth > 900) open(); });
      g.addEventListener('focusout', function (e) {
        if (window.innerWidth <= 900) return;
        if (!g.contains(e.relatedTarget)) close(true);
      });

      // Close AFTER the click resolves. Hiding the panel synchronously removes
      // the link from the render tree mid-dispatch and cancels the navigation.
      // Below 900px the mobile menu owns this interaction: this handler is
      // attached to .has-drop and so runs BEFORE the mobile handler on the
      // container, and would close a submenu the moment it was tapped open.
      g.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) return;
        if (e.target.closest('a[href]')) setTimeout(function () { close(true); }, 0);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      groups.forEach(function (g) {
        g.classList.remove('is-open');
        // Blur too: a trigger that keeps focus would re-open via :focus-within
        // on any browser where the JS state model is not active.
        if (document.activeElement && g.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      });
    });
  });
})();
