/* =========================================================================
   Marketing tracking — loaded once on every landing page:
   <script src="/tracking.js" defer></script>

   The Google tag (gtag.js) itself is pasted inline at the top of <head>;
   this file adds the other platforms and the WhatsApp click conversion.
   Any platform whose ID is left empty is skipped entirely.

   No personal or medical data is ever sent: events carry only an event id.
   ========================================================================= */

var GOOGLE_ADS_SEND_TO = 'AW-17028750147/gw0eCOvMho8dEMO2-Lc_';
var META_PIXEL_ID      = '4380064602230023';
var TIKTOK_PIXEL_ID    = '';
var CLARITY_ID         = '';

(function () {
  'use strict';

  /* ---- Meta Pixel (official base code, PageView) ---- */
  if (META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ---- TikTok Pixel (official base code, page) ---- */
  if (TIKTOK_PIXEL_ID) {
    !function (w, d, t) {
      w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
      ttq.load(TIKTOK_PIXEL_ID);
      ttq.page();
    }(window, document, 'ttq');
  }

  /* ---- Microsoft Clarity (official base code) ---- */
  if (CLARITY_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  /* ---- WhatsApp links ---- */

  var WA_SELECTOR = 'a[href*="wa.me"]';

  /** utm_source from the page URL, reduced to [a-zA-Z0-9_-], max 20 chars. */
  function trafficSource() {
    var raw = '';
    try { raw = new URLSearchParams(window.location.search).get('utm_source') || ''; } catch (e) {}
    var clean = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    return clean || 'web';
  }

  /**
   * Appends " (source)" to the link's text param, or sets "(source)" when
   * the link has no text yet. Encoded with encodeURIComponent, so a space is
   * %20 rather than "+", which WhatsApp would show literally.
   */
  function tagLink(a, source) {
    var href = a.getAttribute('href') || '';
    var hashAt = href.indexOf('#');
    var hash = hashAt >= 0 ? href.slice(hashAt) : '';
    if (hashAt >= 0) href = href.slice(0, hashAt);

    var qAt = href.indexOf('?');
    var base = qAt >= 0 ? href.slice(0, qAt) : href;
    var pairs = qAt >= 0 && href.length > qAt + 1 ? href.slice(qAt + 1).split('&') : [];

    var text = '';
    var others = [];
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      var key = eq >= 0 ? pairs[i].slice(0, eq) : pairs[i];
      if (key === 'text') {
        var val = eq >= 0 ? pairs[i].slice(eq + 1) : '';
        try { text = decodeURIComponent(val.replace(/\+/g, ' ')); } catch (e) { text = val; }
      } else {
        others.push(pairs[i]);
      }
    }

    var tagged = text ? text + ' (' + source + ')' : '(' + source + ')';
    others.push('text=' + encodeURIComponent(tagged));
    a.setAttribute('href', base + '?' + others.join('&') + hash);
  }

  function newEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function onWhatsAppClick(event) {
    var a = event.target && event.target.closest ? event.target.closest(WA_SELECTOR) : null;
    if (!a) return;

    var eventId = newEventId();
    var url = a.href;
    /* a new tab, or a modified/middle click, leaves this page in place, so
       there is nothing to wait for */
    var leavesPage =
      a.target !== '_blank' &&
      !event.defaultPrevented &&
      event.button === 0 &&
      !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Contact', {}, { eventID: eventId });
    }
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('Contact', {}, { event_id: eventId });
    }

    if (typeof window.gtag !== 'function' || !GOOGLE_ADS_SEND_TO) return;

    if (!leavesPage) {
      window.gtag('event', 'conversion', { send_to: GOOGLE_ADS_SEND_TO });
      return;
    }

    /* Google's click-conversion pattern: hold the navigation until the hit
       is sent, with a 1-second fallback so the visitor is never stuck. */
    event.preventDefault();
    var gone = false;
    var go = function () {
      if (gone) return;
      gone = true;
      window.location.href = url;
    };
    window.gtag('event', 'conversion', { send_to: GOOGLE_ADS_SEND_TO, event_callback: go });
    setTimeout(go, 1000);
  }

  function init() {
    var source = trafficSource();
    var links = document.querySelectorAll(WA_SELECTOR);
    for (var i = 0; i < links.length; i++) tagLink(links[i], source);
    document.addEventListener('click', onWhatsAppClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
