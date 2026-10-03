/* =========================================================================
   WhatsApp tracking — loaded once on every landing page:
   <script src="/tracking.js" defer></script>

   All tags and pixels (Google Ads, Meta, TikTok, Clarity...) live in Google
   Tag Manager (GTM-NWKVKB2L), whose snippet is at the top of <head>. This
   file only:
     - writes a pre-filled message, in the page's language and ending in
       "(source)", into every wa.me link;
     - on a WhatsApp click, pushes { event: 'whatsapp_click', wa_source }
       to the dataLayer for GTM to act on.

   No personal or medical data is ever pushed: only the traffic source.
   ========================================================================= */

(function () {
  'use strict';

  var WA_SELECTOR = 'a[href*="wa.me"]';
  var SOURCE_KEY = 'dmc_traffic_source';

  /* The pre-filled message, by page language. The source is appended. */
  var WA_MESSAGE = {
    ar: 'مرحباً، أرغب بالاستفسار عن زراعة الأسنان',
    en: "Hello, I'd like to ask about dental implants"
  };

  /**
   * Where this visit came from, in order: utm_source (reduced to
   * [a-zA-Z0-9_-], max 20 chars), then an ad click id (gclid/gbraid/wbraid
   * → google, fbclid → facebook, ttclid → tiktok), then whatever an earlier
   * page of this visit detected, then "web". A detected source is kept in
   * sessionStorage so it survives moving between pages.
   */
  function trafficSource() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    var has = function (k) { return !!(params && params.get(k)); };

    var detected = '';
    if (params) {
      detected = (params.get('utm_source') || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    }
    if (!detected) {
      if (has('gclid') || has('gbraid') || has('wbraid')) detected = 'google';
      else if (has('fbclid')) detected = 'facebook';
      else if (has('ttclid')) detected = 'tiktok';
    }

    if (detected) {
      try { sessionStorage.setItem(SOURCE_KEY, detected); } catch (e) {}
      return detected;
    }
    var stored = '';
    try { stored = sessionStorage.getItem(SOURCE_KEY) || ''; } catch (e) {}
    return stored.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'web';
  }

  function currentMessage(source) {
    var lang = (document.documentElement.lang || 'ar').slice(0, 2).toLowerCase();
    return (WA_MESSAGE[lang] || WA_MESSAGE.ar) + ' (' + source + ')';
  }

  /**
   * Sets the link's text param to the message for the current language plus
   * " (source)", replacing any earlier one; other params are kept. Encoded
   * with encodeURIComponent, so a space is %20 rather than "+", which
   * WhatsApp would show literally.
   */
  function tagLink(a, source) {
    var href = a.getAttribute('href') || '';
    var hashAt = href.indexOf('#');
    var hash = hashAt >= 0 ? href.slice(hashAt) : '';
    if (hashAt >= 0) href = href.slice(0, hashAt);

    var qAt = href.indexOf('?');
    var base = qAt >= 0 ? href.slice(0, qAt) : href;
    var pairs = qAt >= 0 && href.length > qAt + 1 ? href.slice(qAt + 1).split('&') : [];

    var others = [];
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      var key = eq >= 0 ? pairs[i].slice(0, eq) : pairs[i];
      if (key !== 'text') others.push(pairs[i]);
    }

    others.push('text=' + encodeURIComponent(currentMessage(source)));
    a.setAttribute('href', base + '?' + others.join('&') + hash);
  }

  function onWhatsAppClick(event) {
    var a = event.target && event.target.closest ? event.target.closest(WA_SELECTOR) : null;
    if (!a) return;

    /* built at click time, so it follows the language switcher */
    tagLink(a, source);

    var url = a.href;
    /* a new tab, or a modified/middle click, leaves this page in place, so
       there is nothing to wait for */
    var leavesPage =
      a.target !== '_blank' &&
      !event.defaultPrevented &&
      event.button === 0 &&
      !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

    window.dataLayer = window.dataLayer || [];

    if (!leavesPage) {
      window.dataLayer.push({ event: 'whatsapp_click', wa_source: source });
      return;
    }

    /* Hold the navigation until GTM has fired its tags for this event.
       eventTimeout only works once GTM has loaded, so a local 1-second
       fallback also covers GTM being blocked or slow. */
    event.preventDefault();
    var gone = false;
    var go = function () {
      if (gone) return;
      gone = true;
      window.location.href = url;
    };
    window.dataLayer.push({
      event: 'whatsapp_click',
      wa_source: source,
      eventCallback: go,
      eventTimeout: 1000
    });
    setTimeout(go, 1000);
  }

  var source = 'web';

  /* also kept current on the links themselves, for long-press / copy link */
  function tagAll() {
    var links = document.querySelectorAll(WA_SELECTOR);
    for (var i = 0; i < links.length; i++) tagLink(links[i], source);
  }

  function init() {
    source = trafficSource();
    tagAll();
    document.addEventListener('dmc:langchange', tagAll);
    document.addEventListener('click', onWhatsAppClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
