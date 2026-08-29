/* Site-check form handler.

   Composes a mailto: so the form works with no third-party processor.

   The important part is what happens when that fails. A mailto only opens
   something if the visitor's machine has a mail client registered for the
   protocol. Plenty do not: on Windows the handler is often set to a browser,
   which then has nowhere to send it, and the click does nothing at all. The
   browser reports no error, so the page cannot detect it.

   The old version said "your email app should now be open" and left it there,
   which meant a visitor who filled the form in good faith got silence, and the
   enquiry was lost without either side knowing. So the fallback is now always
   shown: the composed message in full, a button to copy it, and a WhatsApp
   link carrying the same details. Whatever the mail client does, there is a
   working way through. */
(function () {
  'use strict';

  var TO = 'hello@joharcreativ.com';
  var WA = '923320423783';

  var MAPS = {
    f: [['f1', 'First name'], ['f2', 'Work email'], ['f3', 'Website'],
        ['f4', 'Biggest growth blocker']],
    c: [['c1', 'First name'], ['c2', 'Work email'], ['c3', 'Website'],
        ['c4', 'Preferred start'], ['c5', 'Biggest growth blocker']]
  };

  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : null;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var form = document.getElementById('check');
    if (!form) return;

    var prefix = document.getElementById('c1') ? 'c' : 'f';
    var fields = MAPS[prefix];

    var note = document.createElement('div');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.style.cssText = 'margin-top:16px;line-height:1.55;display:none;font-size:.92rem';
    form.appendChild(note);

    function err(msg) {
      note.innerHTML = '';
      var p = document.createElement('p');
      p.style.cssText = 'margin:0;color:#b91c1c';
      p.textContent = msg;
      note.appendChild(p);
      note.style.display = 'block';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = val(prefix + '1'), email = val(prefix + '2'), site = val(prefix + '3');

      if (!name || !email || !site) {
        err('Please fill in your name, work email and website address.');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        err('That email address does not look right. Please check it.');
        return;
      }

      var lines = [];
      for (var i = 0; i < fields.length; i++) {
        var v = val(fields[i][0]);
        if (v) lines.push(fields[i][1] + ': ' + v);
      }
      var body = lines.join('\n') + '\n\nSent from joharcreativ.com';
      var subject = 'Free site check request - ' + site;

      // try the mail client, but never rely on it
      try {
        window.location.href = 'mailto:' + TO + '?subject=' +
          encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      } catch (ignore) { /* some browsers throw on an unhandled protocol */ }

      note.innerHTML = '';
      note.style.display = 'block';

      var head = document.createElement('p');
      head.style.cssText = 'margin:0 0 10px;font-weight:700;color:var(--navy)';
      head.textContent = 'Almost there. Your mail app should have opened.';
      note.appendChild(head);

      var sub = document.createElement('p');
      sub.style.cssText = 'margin:0 0 12px;color:var(--ink-soft)';
      sub.textContent = 'If nothing opened, your browser has no mail app set up. '
        + 'Use either of these instead, the details are already filled in.';
      note.appendChild(sub);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px';

      var wa = document.createElement('a');
      wa.className = 'btn btn-wa';
      wa.style.cssText = 'min-height:44px;display:inline-flex;align-items:center;padding:0 18px';
      wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(subject + '\n\n' + body);
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.textContent = 'Send on WhatsApp';
      row.appendChild(wa);

      var copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'btn btn-line';
      copy.style.cssText = 'min-height:44px;padding:0 18px';
      copy.textContent = 'Copy the message';
      copy.addEventListener('click', function () {
        var text = 'To: ' + TO + '\nSubject: ' + subject + '\n\n' + body;
        function done() {
          copy.textContent = 'Copied. Now paste it into an email to ' + TO;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { show(text); });
        } else {
          show(text);
        }
      });
      row.appendChild(copy);
      note.appendChild(row);

      function show(text) {
        var ta = document.createElement('textarea');
        ta.readOnly = true;
        ta.value = text;
        ta.rows = 7;
        ta.style.cssText = 'width:100%;margin-top:8px;font:inherit;font-size:.86rem;'
          + 'padding:10px;border:1px solid var(--line);border-radius:8px';
        note.appendChild(ta);
        ta.select();
      }

      var addr = document.createElement('p');
      addr.style.cssText = 'margin:0;color:var(--ink-soft)';
      addr.innerHTML = 'Or email <strong>' + TO + '</strong> directly. '
        + 'Either way you get a reply within one working day.';
      note.appendChild(addr);
    });
  });
})();
