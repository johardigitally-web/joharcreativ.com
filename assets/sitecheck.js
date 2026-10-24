/* The instant site check.
 *
 * Posts a URL to the Apps Script web app and renders what comes back. The
 * eleven mechanical checks run here; the five that need a person reading the
 * site are listed afterwards and are the reason the written check exists.
 *
 * text/plain on the POST is deliberate: it avoids a CORS preflight, which
 * Apps Script does not answer. The same trick form.js already uses.
 *
 * Nothing is stored. The URL goes to the checker and nowhere else.
 */
(function () {
  'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyjfGjANoEv0CPsYsB1nx4BMA8D3R5dUYHCgw-w-F9wC9r9aVLrhzsrgXWc8uJqLDF-/exec';

  var form = document.getElementById('wck-form');
  if (!form) return;
  var input = document.getElementById('wck-url');
  var btn = form.querySelector('button');
  var out = document.getElementById('wck-out');
  var label = btn ? btn.textContent : 'Check it';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function say(html) {
    out.innerHTML = html;
    out.hidden = false;
  }

  function busy(on) {
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? 'Checking...' : label;
  }

  var WORD = { pass: 'Fine', warn: 'Worth a look', fail: 'Needs fixing' };

  function render(d) {
    var rows = d.checks.map(function (c) {
      return '<li class="wck-row wck-' + c.state + '">'
           + '<span class="wck-pill">' + WORD[c.state] + '</span>'
           + '<span class="wck-body"><b>' + esc(c.name) + '</b>'
           + '<span>' + esc(c.detail) + '</span></span></li>';
    }).join('');

    var human = d.humanOnly.map(function (h) {
      return '<li>' + esc(h) + '</li>';
    }).join('');

    var host = esc(d.finalUrl || d.url);
    var tally = d.fails + ' needing a fix, ' + d.warns + ' worth a look, ' + d.passes + ' fine';

    say(
      '<div class="wck-head"><h3>' + host + '</h3><p>' + tally + '</p></div>'
      + '<ul class="wck-list">' + rows + '</ul>'
      + '<div class="wck-rest"><h3>Five things this cannot tell you</h3>'
      + '<p>These need somebody reading the site rather than parsing it, and they '
      + 'are usually where the enquiries are being lost. They are what the free '
      + 'written check adds.</p><ul>' + human + '</ul>'
      + '<p class="wck-cta"><a class="btn" href="mailto:hello@joharcreativ.com'
      + '?subject=Free%2015%20point%20site%20check&amp;body=Hi%20Johar%2C%0A%0AMy%20website%3A%20'
      + encodeURIComponent(d.finalUrl || d.url) + '%0AWhat%20I%20need%3A%20%0A">'
      + 'Get the written check</a>'
      + '<a class="btn btn-wa" href="https://wa.me/923320423783?text='
      + encodeURIComponent('Hi Johar, I ran the check on ' + (d.finalUrl || d.url))
      + '" target="_blank" rel="noopener">WhatsApp me</a></p></div>');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var url = (input.value || '').trim();
    if (!url) {
      say('<p class="wck-msg">Put a web address in first.</p>');
      return;
    }
    busy(true);
    say('<p class="wck-msg">Checking ' + esc(url) + ' ...</p>');

    fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ url: url }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    }).then(function (r) {
      return r.json();
    }).then(function (d) {
      busy(false);
      if (!d || !d.ok) {
        say('<p class="wck-msg">' + esc((d && d.error) || 'That did not work.')
          + ' You can still send the address and I will check it by hand: '
          + '<a href="mailto:hello@joharcreativ.com">hello@joharcreativ.com</a></p>');
        return;
      }
      render(d);
      if (window.track) window.track('site_check_tool_used');
    }).catch(function () {
      busy(false);
      say('<p class="wck-msg">Something blocked the request, usually a network or '
        + 'extension issue rather than anything you did. Send the address to '
        + '<a href="mailto:hello@joharcreativ.com">hello@joharcreativ.com</a> '
        + 'and you get the same answer in writing.</p>');
    });
  });
})();
