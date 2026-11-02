/* Sanghavi & Bafana - lightweight interactions.
   Everything here is progressive enhancement: with JS off, all content is visible. */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in w;

  /* ---------- Scroll reveal (IntersectionObserver, transform/opacity only) ---------- */
  // Reveal an element, then hand control back to normal CSS (so hover effects work after the entrance)
  function show(el) {
    el.classList.add('in');
    if (el.hasAttribute('data-r')) w.setTimeout(function () { el.removeAttribute('data-r'); }, 1300);
  }
  function revealAll() { $$('[data-r]').forEach(show); $$('[data-rule]').forEach(show); }

  if (!hasIO || reduce) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    // Cards inside horizontal rails are revealed together when the rail comes into view
    var railIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('[data-r]', e.target).forEach(show);
        railIO.unobserve(e.target);
      });
    }, { threshold: 0.1 });

    $$('.rail').forEach(function (r) { railIO.observe(r); });
    $$('[data-r]').forEach(function (el) { if (!el.closest('.rail')) io.observe(el); });
    $$('[data-rule]').forEach(function (el) { io.observe(el); });

    // Safety net: never leave content hidden if something goes wrong
    w.setTimeout(function () {
      $$('[data-r]:not(.in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < w.innerHeight && r.bottom > 0) show(el);
      });
    }, 1500);
  }

  /* ---------- Counters ---------- */
  var counters = $$('[data-counter]');
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-counter'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1200, t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if (hasIO && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) {
      c.textContent = '0' + (c.getAttribute('data-suffix') || '');
      cio.observe(c);
    });
  }

  /* ---------- Nav: scrolled shadow, mobile menu, active link ---------- */
  var nav = $('#nav'), links = $('#links'), burger = $('#burger');
  var ticking = false;
  var heroImg = $('#heroImg');
  var canParallax = !reduce && heroImg && w.matchMedia('(min-width: 821px)').matches;

  function onScroll() {
    ticking = false;
    var y = w.pageYOffset || d.documentElement.scrollTop;
    nav.classList.toggle('scrolled', y > 8);
    if (canParallax && y < 1000) heroImg.style.transform = 'translate3d(0,' + (y * 0.05).toFixed(1) + 'px,0)';
  }
  w.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  function setMenu(open) {
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!links.classList.contains('open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  w.addEventListener('resize', function () { if (w.innerWidth > 820) setMenu(false); });

  if (hasIO) {
    var map = { top: $('.hero'), services: $('#services'), about: $('#about'), contact: $('#contact') };
    var navLinks = $$('[data-nav]');
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var key = Object.keys(map).filter(function (k) { return map[k] === e.target; })[0];
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav') === key); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (k) { if (map[k]) sio.observe(map[k]); });
  }

  /* ---------- Rails (native scroll + arrow buttons) ---------- */
  $$('.rail').forEach(function (rail) {
    var btns = $$('[data-rail="' + rail.id + '"]');
    function update() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      btns.forEach(function (b) {
        var dir = +b.getAttribute('data-dir');
        b.disabled = max <= 0 || (dir < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var card = rail.firstElementChild;
        var step = (card ? card.getBoundingClientRect().width : 280) + 20;
        rail.scrollBy({ left: step * (+b.getAttribute('data-dir')), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    rail.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    w.addEventListener('resize', update);
    update();
  });

  /* ---------- FAQ accordion ---------- */
  $$('#faqs .qa').forEach(function (qa) {
    var btn = $('button', qa);
    btn.addEventListener('click', function () {
      var open = qa.getAttribute('data-open') === 'true';
      $$('#faqs .qa').forEach(function (o) {
        o.setAttribute('data-open', 'false');
        $('button', o).setAttribute('aria-expanded', 'false');
      });
      if (!open) { qa.setAttribute('data-open', 'true'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Contact form -> mailto ---------- */
  var form = $('#form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var body = 'Name: ' + f.name.value + '\nPhone: ' + f.phone.value + '\nEmail: ' + f.email.value +
                 '\nInterested Service: ' + f.service.value + '\n\n' + f.message.value;
      var subject = 'Website enquiry from ' + (f.name.value || 'website visitor');
      $('#note').classList.add('show');
      w.location.href = 'mailto:info@sanghaviandbafana.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }
})();
