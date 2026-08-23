/* Site-check form handler.
   Interim: composes a mailto: so the form works with no third-party processor.
   Replace with a Tally endpoint (per the plan) when an account exists. */
(function () {
  'use strict';

  var TO = 'hello@joharcreativ.com';

  var MAPS = {
    f: [['f1', 'First name'], ['f2', 'Work email'], ['f3', 'Website'],
        ['f4', 'Biggest growth blocker']],
    c: [['c1', 'First name'], ['c2', 'Work email'], ['c3', 'Website'],
        ['c4', 'Preferred start'], ['c5', 'Biggest growth blocker']]
  };

  function val(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    return (el.value || '').trim();
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

    var note = document.createElement('p');
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.style.cssText = 'margin-top:14px;line-height:1.5;display:none';
    form.appendChild(note);

    function say(html, ok) {
      note.innerHTML = html;
      note.style.color = ok ? 'inherit' : '#b91c1c';
      note.style.display = 'block';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = val(prefix + '1'), email = val(prefix + '2'), site = val(prefix + '3');

      if (!name || !email || !site) {
        say('Please fill in your name, work email and website address.', false);
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        say('That email address does not look right. Please check it.', false);
        return;
      }

      var lines = [];
      for (var i = 0; i < fields.length; i++) {
        var v = val(fields[i][0]);
        if (v) lines.push(fields[i][1] + ': ' + v);
      }
      var body = lines.join('\n') + '\n\nSent from joharcreativ.com';

      var href = 'mailto:' + TO +
        '?subject=' + encodeURIComponent('Free site check request - ' + site) +
        '&body=' + encodeURIComponent(body);

      window.location.href = href;

      say('Your email app should now be open with the details filled in — just press send.' +
          '<br><br>If nothing happened, email <strong>' + TO + '</strong> directly with your website address. ' +
          'You get a reply from me within one working day.', true);
    });
  });
})();
