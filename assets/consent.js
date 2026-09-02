/* Consent banner + gated GA4 loader.
   GA4 sets non-essential cookies and sends data to Google in the US, so under
   ePrivacy it needs PRIOR opt-in. Nothing from Google loads until the visitor
   accepts: no script, no cookie, no request. Reject is exactly as easy as
   accept, which the GDPR requires and most banners quietly ignore. */
(function () {
  'use strict';

  var GA4_ID = 'G-9B7R2NEJQ5';
  var COOKIE = 'jc_consent';
  var MAX_AGE = 60 * 60 * 24 * 180;   // 180 days, then ask again

  function read() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function write(v) {
    document.cookie = COOKIE + '=' + encodeURIComponent(v) +
      ';path=/;max-age=' + MAX_AGE + ';SameSite=Lax' +
      (location.protocol === 'https:' ? ';Secure' : '');
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // Consent Mode v2 - everything denied until the visitor says otherwise.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA4_ID, { anonymize_ip: true });
  }

  function accept() {
    write('analytics');
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGA();
    hide();
  }

  function reject() {
    write('essential');
    // Clear anything Google may have set on an earlier visit.
    var names = ['_ga', '_gid', '_ga_' + GA4_ID.replace('G-', '')];
    names.forEach(function (n) {
      document.cookie = n + '=;path=/;max-age=0';
      document.cookie = n + '=;path=/;domain=.' + location.hostname + ';max-age=0';
    });
    hide();
  }

  var el = null;
  function hide() { if (el && el.parentNode) { el.parentNode.removeChild(el); } el = null; }

  /* Asking a German visitor for consent in English is the kind of thing the GDPR
     pages on this site criticise other people for, so the banner follows the
     language the page declares. */
  var COPY = {
    en: {
      aria: 'Cookie choice',
      body: 'I use Google Analytics to see which pages get read. It sets cookies and sends ' +
            'data to Google in the United States. Nothing loads unless you say yes, and the ' +
            'site works exactly the same either way. ' +
            '<a href="/cookie-policy/">Cookie policy</a>',
      yes: 'Allow analytics',
      no: 'No thanks'
    },
    de: {
      aria: 'Cookie-Auswahl',
      body: 'Ich nutze Google Analytics, um zu sehen, welche Seiten gelesen werden. Dabei ' +
            'werden Cookies gesetzt und Daten an Google in die USA übertragen. Ohne Ihre ' +
            'Einwilligung wird nichts davon geladen, und die Website funktioniert in beiden ' +
            'Fällen genau gleich. ' +
            '<a href="/cookie-policy/" hreflang="en" lang="en">Cookie policy (englisch)</a>',
      yes: 'Analytics erlauben',
      no: 'Nein, danke'
    }
  };

  function copy() {
    var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
    return COPY[lang.slice(0, 2)] || COPY.en;
  }

  function show() {
    if (el) return;
    var c = copy();
    el = document.createElement('div');
    el.className = 'cookie-bar';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', c.aria);
    el.innerHTML =
      '<div class="cookie-bar-in">' +
        '<p>' + c.body + '</p>' +
        '<div class="cookie-bar-btns">' +
          '<button type="button" class="btn btn-small" data-consent="yes">' + c.yes + '</button>' +
          '<button type="button" class="btn btn-line btn-small" data-consent="no">' + c.no + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-consent="yes"]').addEventListener('click', accept);
    el.querySelector('[data-consent="no"]').addEventListener('click', reject);
  }

  function start() {
    var c = read();
    if (c === 'analytics') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
      loadGA();
    } else if (c !== 'essential') {
      show();
    }

    // "Manage cookie settings" on the cookie policy page re-opens the choice.
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-consent-reopen]') : null;
      if (!t) return;
      e.preventDefault();
      hide();
      show();
    });
  }

  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);

  /* Event tracking. A no-op until consent is given, so it is always safe to call. */
  window.track = function (name, params) {
    if (loaded && typeof window.gtag === 'function') window.gtag('event', name, params || {});
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
      if (a) window.track('email_click', { link_url: a.getAttribute('href') });
    });
    var f = document.getElementById('check');
    if (f) f.addEventListener('submit', function () { window.track('site_check_submitted'); });
  });
})();
