/*
  Shared behavior — reused verbatim on every specialty landing page.
  Depends only on the markup/classes defined in /components/*.html
  and css/components.css. No page-specific logic here.
*/
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeaderScroll() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initScrollReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach(function (el) { observer.observe(el); });
  }

  /*
    i18n — generic AR/EN toggle engine. Reads translations from window.I18N
    (defined per-page in i18n.js). Elements opt in via:
      data-i18n="key"       → sets textContent
      data-i18n-html="key"  → sets innerHTML (for fragments with nested tags)
      data-i18n-attr="attrName:key" → sets that one attribute
    Persists the choice in localStorage and fires "dmc:langchange" on
    document after every switch, so page-specific scripts (e.g. anything
    that measured element positions in one language) can react.
  */
  function applyLanguage(lang) {
    var dict = window.I18N || {};
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = dict[el.getAttribute('data-i18n')];
      if (entry && entry[lang] != null) el.textContent = entry[lang];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var entry = dict[el.getAttribute('data-i18n-html')];
      if (entry && entry[lang] != null) el.innerHTML = entry[lang];
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var entry = dict[parts[1].trim()];
        if (entry && entry[lang] != null) el.setAttribute(attr, entry[lang]);
      });
    });

    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    });
    try { localStorage.setItem('dmc-lang', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('dmc:langchange', { detail: { lang: lang } }));
  }

  function initI18n() {
    if (!window.I18N) return;
    var urlLang = new URLSearchParams(location.search).get('lang');
    var stored = null;
    try { stored = localStorage.getItem('dmc-lang'); } catch (e) {}
    applyLanguage((urlLang || stored) === 'en' ? 'en' : 'ar');

    document.querySelectorAll('.lang-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initI18n();
    initHeaderScroll();
    initMobileNav();
    initScrollReveal();
  });
})();
