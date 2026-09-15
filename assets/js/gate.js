/* Client-side password gate for protected case studies.
   NOTE: this deters casual browsing only. The page markup is still present in
   the HTML source, so treat it as a soft gate, not real security. */
(function () {
  var KEY = 'lw-gate-ok';
  var HASH = 'fda2d99ab3517f1e04606c70da1ea89008a7aca9e9afb31ea357b99995eb4bbe'; // sha-256 of the password

  function unlock() {
    document.documentElement.classList.remove('lw-gated');
    var g = document.getElementById('lw-gate');
    if (g) g.remove();
  }

  async function sha256(s) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  try { if (sessionStorage.getItem(KEY) === HASH) { return; } } catch (e) {}

  document.documentElement.classList.add('lw-gated');

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.createElement('div');
    wrap.id = 'lw-gate';
    wrap.innerHTML =
      '<div class="lw-gate-card">' +
        '<h1>Protected page</h1>' +
        '<p>If you have access to this page, please type the password below.</p>' +
        '<form><input type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" />' +
        '<button type="submit">Submit</button></form>' +
        '<p class="lw-gate-err" hidden>Incorrect password. Please try again.</p>' +
        '<p class="lw-gate-back"><a href="/">&larr; Back to laurenwynne.com</a></p>' +
      '</div>';
    document.body.appendChild(wrap);
    var form = wrap.querySelector('form');
    var input = wrap.querySelector('input');
    var err = wrap.querySelector('.lw-gate-err');
    input.focus();
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var h = await sha256(input.value);
      if (h === HASH) {
        try { sessionStorage.setItem(KEY, HASH); } catch (e2) {}
        unlock();
      } else {
        err.hidden = false;
        input.value = '';
        input.focus();
      }
    });
  });
})();
