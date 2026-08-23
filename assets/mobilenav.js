/* Mobile navigation.
   Below 900px the stylesheet hid .nav-links entirely and nothing replaced it,
   so phone and tablet visitors had no navigation at all. This turns the same
   markup into a slide-down panel behind a toggle, so there is one nav to
   maintain rather than two. */
(function () {
  'use strict';

  var BREAK = 900;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var header = document.querySelector('header.nav');
    var wrap = header && header.querySelector('.wrap');
    var nav = header && header.querySelector('.nav-links');
    if (!header || !wrap || !nav) return;

    if (!nav.id) nav.id = 'primary-nav';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('data-nav-toggle', '');
    btn.setAttribute('aria-controls', nav.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    wrap.appendChild(btn);

    function open() {
      header.classList.add('nav-open');
      document.body.classList.add('nav-locked');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
    }

    function close() {
      header.classList.remove('nav-open');
      document.body.classList.remove('nav-locked');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Menu');
      // collapse any expanded submenu so it reopens clean next time
      nav.querySelectorAll('.has-drop.is-open').forEach(function (g) {
        g.classList.remove('is-open');
      });
    }

    btn.addEventListener('click', function () {
      header.classList.contains('nav-open') ? close() : open();
    });

    // On touch, the first tap on a dropdown parent should reveal its children
    // rather than navigate away - otherwise the sub-items are unreachable.
    nav.addEventListener('click', function (e) {
      if (window.innerWidth > BREAK) return;
      var parentLink = e.target.closest('.has-drop > a');
      if (parentLink) {
        var group = parentLink.parentNode;
        if (!group.classList.contains('is-open')) {
          e.preventDefault();
          nav.querySelectorAll('.has-drop.is-open').forEach(function (g) {
            if (g !== group) g.classList.remove('is-open');
          });
          group.classList.add('is-open');
          return;
        }
      }
      if (e.target.closest('a[href]')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) { close(); btn.focus(); }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > BREAK) close();
    });
  });
})();
