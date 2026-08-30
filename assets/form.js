/* Site check form.

   Posts the enquiry to a backend that stores it in a Google Sheet and emails a
   copy. No mailto, so it does not matter whether the visitor's machine has a
   mail client: the previous version depended on one, and on any machine whose
   mailto handler is a browser the click did nothing at all and the enquiry was
   lost silently.

   ENDPOINT is the Apps Script web app URL. While it is empty the form falls
   back to opening a mail client, which is worse but is better than a button
   that does nothing. See memory/tools/form_backend.gs for the deploy steps. */
(function () {
  'use strict';

  // Apps Script web app: appends to a Google Sheet and emails a copy. Storing and
  // emailing are independent there, so one failure does not lose the enquiry.
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxtzB2sB5PuXKoSnNaWL3xF9i-6YYBOUOU3HQREr5JS4OL_gK73-m9_WohE_eZd9ojc/exec';
  var TO = 'hello@joharcreativ.com';
  var WA = '923320423783';

  var MAPS = {
    f: { name: 'f1', email: 'f2', website: 'f3', blocker: 'f4' },
    c: { name: 'c1', email: 'c2', website: 'c3', start: 'c4', blocker: 'c5' }
  };

  function val(id) {
    var el = id && document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var form = document.getElementById('check');
    if (!form) return;

    var prefix = document.getElementById('c1') ? 'c' : 'f';
    var map = MAPS[prefix];
    var button = form.querySelector('button[type="submit"], button:not([type])');

    // honeypot: bots fill everything, people never see it
    var pot = document.createElement('input');
    pot.type = 'text';
    pot.name = 'company';
    pot.tabIndex = -1;
    pot.autocomplete = 'off';
    pot.setAttribute('aria-hidden', 'true');
    // display:none rather than off screen: an off screen input still takes part in
    // layout and was being counted as an undersized tap target by the audit.
    pot.style.cssText = 'display:none';
    form.appendChild(pot);

    var note = document.createElement('div');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.style.cssText = 'margin-top:16px;line-height:1.55;display:none;font-size:.94rem';
    form.appendChild(note);

    function say(html, colour) {
      note.innerHTML = html;
      note.style.color = colour || 'inherit';
      note.style.display = 'block';
      try {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        note.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      } catch (ignore) { note.scrollIntoView(false); }
    }

    function busy(on) {
      if (!button) return;
      button.disabled = on;
      button.textContent = on ? 'Sending...' : button.getAttribute('data-label')
        || 'Send me the site check';
    }
    if (button) button.setAttribute('data-label', button.textContent);

    function mailtoFallback(payload) {
      var lines = [];
      for (var k in map) {
        if (payload[k]) lines.push(k.charAt(0).toUpperCase() + k.slice(1) + ': ' + payload[k]);
      }
      var body = lines.join('\n') + '\n\nSent from joharcreativ.com';
      var subject = 'Free site check request - ' + payload.website;
      try {
        window.location.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
      } catch (ignore) { /* unhandled protocol */ }
      say('<p style="margin:0 0 10px;font-weight:700;color:var(--navy)">Your mail app should have '
        + 'opened.</p><p style="margin:0 0 12px;color:var(--ink-soft)">If it did not, send this to '
        + '<strong>' + TO + '</strong> or message me on '
        + '<a href="https://wa.me/' + WA + '?text=' + encodeURIComponent(subject + '\n\n' + body)
        + '" target="_blank" rel="noopener">WhatsApp</a>. Reply within one working day.</p>');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var payload = {};
      for (var k in map) payload[k] = val(map[k]);
      payload.company = pot.value;
      payload.page = location.pathname;
      payload.referrer = document.referrer || '';
      payload.ua = navigator.userAgent;

      if (!payload.name || !payload.email || !payload.website) {
        say('Please fill in your name, work email and website address.', '#b91c1c');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
        say('That email address does not look right. Please check it.', '#b91c1c');
        return;
      }

      if (!ENDPOINT) { mailtoFallback(payload); return; }

      busy(true);
      say('Sending your details...', 'inherit');

      // text/plain avoids a CORS preflight, which Apps Script does not answer
      fetch(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      }).then(function (r) {
        return r.json().catch(function () { return { ok: r.ok }; });
      }).then(function (res) {
        busy(false);
        if (!res || res.ok === false) throw new Error(res && res.error);
        form.reset();
        pot.value = '';
        say('<p style="margin:0 0 8px;font-weight:700;color:var(--navy)">Sent. Thank you.</p>'
          + '<p style="margin:0;color:var(--ink-soft)">Your written 15 point check comes back '
          + 'within two working days, to the address you gave. If you would rather talk sooner, '
          + '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">message me on '
          + 'WhatsApp</a>.</p>');
      }).catch(function () {
        busy(false);
        say('<p style="margin:0 0 8px;font-weight:700;color:#b91c1c">That did not send.</p>'
          + '<p style="margin:0;color:var(--ink-soft)">Something blocked the request, which is '
          + 'usually a network or extension issue rather than anything you did. Email '
          + '<strong>' + TO + '</strong> or message me on '
          + '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">WhatsApp</a> and '
          + 'you will get the same reply within one working day.</p>');
      });
    });
  });
})();
