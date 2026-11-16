/* Scroll motion for the landing page: drives the hero parallax, the section rail and the nav highlight.
   Reveals themselves are done by the page's own observer (they replay every time a block re-enters the screen). */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var secs = [['top', 'Home'], ['before-after', 'The difference'], ['industries', 'Industries'], ['features', 'Features'], ['onboarding', 'How it works'], ['pricing', 'Pricing'], ['hardware', 'Hardware'], ['faq', 'FAQ'], ['contact', 'Contact']];
  var dots = [], last = -1, ticking = false;
  var nativeBar = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');

  function build() {
    var rail = document.createElement('nav');
    rail.className = 'cy-rail';
    rail.setAttribute('aria-label', 'Sections');
    rail.innerHTML = secs.map(function (s) { return '<a href="#' + s[0] + '" aria-label="' + s[1] + '"><span>' + s[1] + '</span></a>'; }).join('');
    document.body.appendChild(rail);
    dots = [].slice.call(rail.children);
  }

  function frame() {
    ticking = false;
    var y = window.scrollY || 0, h = window.innerHeight, pin = document.getElementById('pin');
    if (pin && !reduce && y < h * 2) pin.style.setProperty('--p', Math.min(1.4, y / h).toFixed(3));
    if (!nativeBar) {
      var bar = document.querySelector('.cy-progress'), max = document.documentElement.scrollHeight - h;
      if (bar) { bar.style.display = 'block'; bar.style.position = 'absolute'; bar.style.left = '0'; bar.style.bottom = '-1px'; bar.style.height = '3px'; bar.style.width = '100%'; bar.style.background = '#e9651b'; bar.style.transformOrigin = '0 50%'; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')'; }
    }
    var cur = 0;
    secs.forEach(function (s, i) { var el = document.getElementById(s[0]); if (el && el.getBoundingClientRect().top <= h * 0.4) cur = i; });
    if (cur !== last) {
      last = cur;
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
      [].forEach.call(document.querySelectorAll('header .navlink'), function (a) {
        if (a.getAttribute('href') === '#' + secs[cur][0]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  // wait until the page component has rendered its sections
  var tries = 0;
  (function wait() {
    if (document.getElementById('contact') && document.getElementById('pin')) {
      build(); frame();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    } else if (tries++ < 100) setTimeout(wait, 100);
  })();
})();
