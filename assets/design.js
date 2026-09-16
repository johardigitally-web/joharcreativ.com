/* Design refresh behaviour, shared by every page. Injected after mobilenav.js by
   memory/tools/apply_design.py, which is also how it reaches the generated
   German pages (build_lang.py copies everything after </footer>).

   What it does, all of it behind prefers-reduced-motion where it moves anything:
   1. header.nav gets .scrolled past 40px, and on a phone .hide while reading
      down, back on scroll-up. The open mobile menu cancels the hide.
   2. The phone CTA bar (.mobile-cta) steps aside (.away) while any
      [data-cta-anchor] group is at least a fifth on screen, and while the
      consent bar is present. consent.js inserts that bar at runtime, so this
      watches the body for it rather than looking once.
   3. The hero card stack (.hero-art, built by compose.py) fades in once.
   4. Elements carrying data-to with no existing count script count up once
      when they arrive. The three count-ups the site already has (.tick,
      .count, .fc-nums b) keep their own scripts; nothing here touches them.
   No class the checker matches is written here except .away, which is the
   bar's JS-only state. */
(function () {
  'use strict';
  var doc = document.documentElement;
  if (doc.className.indexOf('js') < 0) doc.className += ' js';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 640px)');

  /* ---- header ---- */
  var head = document.querySelector('header.nav');
  var lastY = 0;
  function onScroll() {
    if (!head) return;
    var y = window.scrollY;
    head.classList.toggle('scrolled', y > 40);
    if (phone.matches && !head.classList.contains('nav-open') && !reduce) {
      head.classList.toggle('hide', y > lastY && y > 160);
    } else {
      head.classList.remove('hide');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- the phone bar ---- */
  var bar = document.querySelector('.mobile-cta');
  if (bar) {
    var anchors = document.querySelectorAll('[data-cta-anchor]');
    var seen = [];
    var consentShown = !!document.querySelector('.cookie-bar');
    function setBar() {
      var any = consentShown;
      for (var i = 0; i < seen.length; i++) if (seen[i]) any = true;
      bar.classList.toggle('away', any);
    }
    if (anchors.length && 'IntersectionObserver' in window) {
      var barIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          seen[Array.prototype.indexOf.call(anchors, en.target)] = en.isIntersecting;
        });
        setBar();
      }, { threshold: .2 });
      anchors.forEach(function (a) { barIO.observe(a); });
    }
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        var now = !!document.querySelector('.cookie-bar');
        if (now !== consentShown) { consentShown = now; setBar(); }
      }).observe(document.body, { childList: true });
    }
    setBar();
  }

  /* ---- hero card stack ---- */
  var art = document.querySelector('.hero-art');
  if (art) {
    var cards = art.querySelectorAll('.hcard, .hero-card');
    Array.prototype.forEach.call(cards, function (c, i) { c.style.transitionDelay = (200 + i * 120) + 'ms'; });
    if (reduce) {
      art.classList.add('in');
    } else {
      requestAnimationFrame(function () { requestAnimationFrame(function () { art.classList.add('in'); }); });
      window.setTimeout(function () {
        Array.prototype.forEach.call(cards, function (c) { c.style.transitionDelay = '0ms'; });
      }, 1200);
    }
  }

  /* ---- count-up for the metric card and any data-to element without its own script ---- */
  var own = ['tick', 'count'];
  function counts(el) {
    for (var i = 0; i < own.length; i++) if (el.classList.contains(own[i])) return true;
    return false;
  }
  var pending = Array.prototype.filter.call(document.querySelectorAll('[data-to]'), function (el) { return !counts(el) && !el.hasAttribute('data-count'); });
  function count(el) {
    var to = parseFloat(String(el.getAttribute('data-to')).replace(/,/g, ''));
    var final = el.getAttribute('data-final') || el.textContent;
    if (isNaN(to) || reduce) { el.textContent = final; return; }
    var dec = (String(el.getAttribute('data-to')).split('.')[1] || '').length;
    var m = final.match(/^([^0-9]*)[0-9][0-9,.]*(.*)$/);
    var pre = m ? m[1] : '', post = m ? m[2] : '';
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 700, 1);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (to * p).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + post;
      if (p < 1) requestAnimationFrame(frame); else el.textContent = final;
    }
    requestAnimationFrame(frame);
  }
  if (pending.length && 'IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        count(e.target);
      });
    }, { threshold: .5 });
    pending.forEach(function (el) { el.setAttribute('data-final', el.textContent); cio.observe(el); });
  }

  /* ---- the timeline line draws when its row arrives (.step rows from compose.py) ---- */
  var steps = document.querySelectorAll('.steps .step, .step');
  if (steps.length && 'IntersectionObserver' in window && !reduce) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        sio.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(steps, function (s) { sio.observe(s); });
  } else {
    Array.prototype.forEach.call(steps, function (s) { s.classList.add('in'); });
  }
})();
