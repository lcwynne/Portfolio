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

  // crypto.subtle only exists in secure contexts. GitHub Pages serves plain HTTP
  // until its certificate is issued, so fall back to a self-contained SHA-256
  // rather than throwing and refusing every password.
  function sha256Fallback(ascii) {
    function rrot(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), i, j, result = '';
    var words = [], asciiBitLength = ascii.length * 8;
    var hash = sha256Fallback.h = sha256Fallback.h || [];
    var k = sha256Fallback.k = sha256Fallback.k || [];
    var primeCounter = k.length, isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    hash = hash.slice(0);
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return null;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] + (rrot(e, 6) ^ rrot(e, 11) ^ rrot(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : (w[i - 16] +
            (rrot(w15, 7) ^ rrot(w15, 18) ^ (w15 >>> 3)) + w[i - 7] +
            (rrot(w2, 17) ^ rrot(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rrot(a, 2) ^ rrot(a, 13) ^ rrot(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256(s) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    }
    return sha256Fallback(unescape(encodeURIComponent(s)));
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
