/* Page-specific behavior — زراعة الأسنان الرقمية (implant landing page) */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initCountUp() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    function render(el, target, decimals, suffix) {
      el.textContent = target.toFixed(decimals) + suffix;
    }

    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reducedMotion) { render(el, target, decimals, suffix); return; }
      var start = null;
      var duration = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else render(el, target, decimals, suffix);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        animate(el);
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach(function (el) { observer.observe(el); });
  }

  function initStepLines() {
    var lines = document.querySelectorAll('[data-line]');
    if (!lines.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      lines.forEach(function (l) { l.classList.add('in-view'); });
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
      { threshold: 0.4 }
    );
    lines.forEach(function (l) { observer.observe(l); });
  }

  function initStepStagger() {
    document.querySelectorAll('.steps-row .step').forEach(function (el, i) {
      el.style.transitionDelay = (i * 90) + 'ms';
    });
  }

  function initHeroTilt() {
    if (reducedMotion) return;
    var visual = document.getElementById('heroVisual');
    var card = visual && visual.querySelector('.hero-photo-card');
    if (!visual || !card) return;
    var maxTilt = 8;
    visual.addEventListener('mousemove', function (e) {
      var rect = visual.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'rotateY(' + (x * maxTilt) + 'deg) rotateX(' + (-y * maxTilt) + 'deg)';
    });
    visual.addEventListener('mouseleave', function () {
      card.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }

  function initHeroVideo() {
    var video = document.querySelector('.hero-video');
    if (!video) return;
    if (reducedMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  }

  function initToothFly() {
    var tooth = document.getElementById('toothFly');
    var hero = document.querySelector('.hero');
    var photo = document.querySelector('.hero-photo-card');
    var target = document.getElementById('targetWord');
    if (!tooth || !hero || !photo || !target) return;

    var landed = false;
    var idleAnim = null;
    var baseImpactX = null;
    var baseRestTop = null;

    function place() {
      var heroRect = hero.getBoundingClientRect();
      var photoRect = photo.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var tw = tooth.offsetWidth || 64;
      var th = tooth.offsetHeight || 64;

      var impactX = (photoRect.left + photoRect.width / 2) - heroRect.left;
      // Rest position: the tooth's own bottom edge touches the frame's top border
      // (its "start"), not the tooth's center — so it reads as landing ON the edge.
      var restTop = (photoRect.top - heroRect.top) - th;

      var landX = (targetRect.left + targetRect.width / 2) - heroRect.left;
      var landY = (targetRect.top - heroRect.top) - th * 0.7;

      tooth.style.left = (impactX - tw / 2) + 'px';
      baseImpactX = impactX;
      baseRestTop = restTop;

      // .hero has overflow:hidden — clamp the fall so it never starts above the
      // section's own top edge (which would clip the start of the drop invisibly).
      var fallDistance = Math.max(140, Math.min(300, restTop - 20));
      tooth.style.top = (restTop - fallDistance) + 'px';

      return {
        restTop: restTop,
        dx: landX - impactX,
        dy: landY - restTop,
        fallDistance: fallDistance
      };
    }

    // Small gravity/bounce simulation for the drop — real acceleration and a
    // physical, decaying bounce when it hits the frame's top edge.
    function dropWithGravity(restTop, fallDistance, onSettled) {
      var y = -fallDistance;
      var vy = 0;
      var rotation = -22;
      var squash = 0;
      var wobble = 0;
      var bounces = 0;
      var g = 3600;            // px/s^2
      var restitution = 0.4;   // energy kept per bounce
      var lastT = null;

      function frame(t) {
        if (lastT === null) lastT = t;
        var dt = Math.min((t - lastT) / 1000, 0.032);
        lastT = t;

        vy += g * dt;
        y += vy * dt;
        rotation += (0 - rotation) * Math.min(dt * 2.5, 1);

        if (y >= 0) {
          y = 0;
          var impactSpeed = vy;
          vy = -vy * restitution;
          bounces++;
          squash = Math.min(impactSpeed / 1500, 1);
          wobble = (Math.random() - 0.5) * 8;
          if (bounces >= 3 || Math.abs(vy) < 70) {
            tooth.style.top = restTop + 'px';
            tooth.style.transform = 'translate(0px,0px) rotate(0deg) scale(1,1)';
            onSettled();
            return;
          }
        }

        squash *= 0.85;
        wobble *= 0.8;
        var scaleY = 1 - squash * 0.32;
        var scaleX = 1 + squash * 0.32;

        tooth.style.top = (restTop + y) + 'px';
        tooth.style.transform = 'rotate(' + (rotation + wobble).toFixed(2) + 'deg) scale(' + scaleX.toFixed(3) + ',' + scaleY.toFixed(3) + ')';

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function glideToWord(dx, dy) {
      if (!tooth.animate) {
        tooth.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        startIdleBob(dx, dy);
        return;
      }
      var glide = tooth.animate([
        { transform: 'translate(0px,0px) rotate(0deg) scale(1,1)' },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(8deg) scale(0.85,0.85)' }
      ], { duration: 900, easing: 'cubic-bezier(.25,.7,.35,1)', fill: 'forwards' });
      glide.onfinish = function () { startIdleBob(dx, dy); };
    }

    function startIdleBob(dx, dy) {
      landed = true;
      if (reducedMotion) { tooth.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; return; }
      if (!tooth.animate) return;
      idleAnim = tooth.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(8deg) scale(0.85,0.85)' },
        { transform: 'translate(' + dx + 'px,' + (dy - 10) + 'px) rotate(4deg) scale(0.85,0.85)' },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(8deg) scale(0.85,0.85)' }
      ], { duration: 3200, iterations: Infinity, easing: 'ease-in-out' });
    }

    // The word the tooth lands on gets re-translated on language switch, which
    // shifts its position — smoothly slide the (already landed) tooth to match.
    function retarget() {
      if (!landed || baseImpactX === null) return;
      // #targetWord is inside the h1, which data-i18n-html replaces wholesale on
      // every language switch — that swap creates a brand-new node, so the
      // original `target` reference above would be stale/detached. Re-query it.
      var freshTarget = document.getElementById('targetWord');
      if (!freshTarget) return;
      var heroRect = hero.getBoundingClientRect();
      var targetRect = freshTarget.getBoundingClientRect();
      var th = tooth.offsetHeight || 64;
      var landX = (targetRect.left + targetRect.width / 2) - heroRect.left;
      var landY = (targetRect.top - heroRect.top) - th * 0.7;
      var dx = landX - baseImpactX;
      var dy = landY - baseRestTop;

      if (idleAnim) idleAnim.cancel();
      if (reducedMotion || !tooth.animate) {
        tooth.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        landed = true;
        return;
      }
      var move = tooth.animate([
        { transform: tooth.style.transform || 'translate(0px,0px)' },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(8deg) scale(0.85,0.85)' }
      ], { duration: 500, easing: 'ease-in-out', fill: 'forwards' });
      move.onfinish = function () { startIdleBob(dx, dy); };
    }
    document.addEventListener('dmc:langchange', retarget);

    function run() {
      var delta = place();
      tooth.style.opacity = '1';

      if (reducedMotion) {
        tooth.style.top = delta.restTop + 'px';
        tooth.style.transform = 'translate(' + delta.dx + 'px,' + delta.dy + 'px)';
        landed = true;
        return;
      }

      setTimeout(function () {
        dropWithGravity(delta.restTop, delta.fallDistance, function () {
          glideToWord(delta.dx, delta.dy);
        });
      }, 700);
    }

    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStepStagger();
    initCountUp();
    initStepLines();
    initHeroTilt();
    initHeroVideo();
    initToothFly();
  });
})();
