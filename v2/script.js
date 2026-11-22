/* fadila ✿ v2 — scroll story
   No libraries. Sticky stages + a scroll-progress calculation decide which
   "step" each chapter is on; CSS transitions do the popping (transform +
   opacity only). */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  // the background word is a tape banner: repeat it so it runs edge to edge
  document.querySelectorAll('.bgword').forEach((b) => {
    b.textContent = Array(40).fill(b.textContent.trim()).join('  ✿  ');
  });
  const mqPin = window.matchMedia('(min-width: 721px) and (min-height: 560px)');
  const mqStill = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- the art sketchbook: bind the listed paintings into turning leaves ----------
  // faces in order: cover, painting 1 (inside cover), painting 2, 3, ...
  // leaf k carries faces 2k (front, right-hand page) and 2k+1 (back, left-hand page)
  document.querySelectorAll('.scrapbook').forEach((book) => {
    const pages = [...book.querySelectorAll(':scope > figure.page')];
    const cover = document.createElement('div');
    cover.className = 'cover-face';
    cover.setAttribute('aria-hidden', 'true');
    cover.innerHTML = '<span class="sb-washi"></span><span class="sb-label"><b>sketchbook</b><span>art ✿ dila</span></span><svg class="sb-star"><use href="#star"/></svg>';
    const faces = [cover, ...pages];
    const n = Math.ceil(faces.length / 2);
    for (let k = 0; k < n; k++) {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      leaf.dataset.step = String(k + 1);        // leaf k turns over at step k + 2
      leaf.style.setProperty('--z', 50 - k);
      leaf.style.setProperty('--zf', 51 + k);
      const front = faces[2 * k], back = faces[2 * k + 1];
      front.classList.add('leaf-front'); leaf.append(front);
      if (back) { back.classList.add('leaf-back'); leaf.append(back); }
      book.append(leaf);
    }
    const rings = document.createElement('span');
    rings.className = 'rings'; rings.setAttribute('aria-hidden', 'true');
    book.append(rings);
    // closed, then one step per turn; the last leaf never turns
    const ch = book.closest('.ch');
    if (ch) ch.dataset.steps = String(n);
  });

  const sections = [...document.querySelectorAll('.ch')];
  const chapters = sections
    .filter((ch) => ch.dataset.steps)
    .map((ch) => ({
      ch,
      n: Number(ch.dataset.steps),
      items: [...ch.querySelectorAll('[data-step]')].map((el, _, all) => {
        // order within its step, so a step's artefacts spring out one after another
        el.style.setProperty('--i', all.filter((o) => o.dataset.step === el.dataset.step).indexOf(el));
        return el;
      }),
      bg: ch.querySelector('.bgword'),
      step: -1,
      start: 0,
      end: 1,
    }));

  const wamNum = document.getElementById('wamNum');
  const wamName = document.getElementById('wamName');

  const wamBtn = document.querySelector('.wam-btn');
  const wamMenu = document.getElementById('wamMenu');
  const wamLinks = [...wamMenu.querySelectorAll('a')];

  let mode = null;
  let io = null;
  let ticking = false;
  let lastSection = null;

  /* ---------- modes ---------- */
  function setMode() {
    const next = mqStill.matches ? 'still' : mqPin.matches ? 'pinned' : 'flow';
    if (next === mode) return;
    mode = next;
    root.classList.remove('pinned', 'flow', 'still');
    root.classList.add(mode);

    if (io) { io.disconnect(); io = null; }
    chapters.forEach((c) => {
      c.step = -1;
      delete c.ch.dataset.at;
      c.ch.style.setProperty('--n', c.n);
      c.items.forEach((el) => el.classList.remove('in', 'past', 'current'));
      if (c.bg) c.bg.style.transform = '';
    });

    if (mode === 'still') {
      chapters.forEach((c) => c.items.forEach((el) => el.classList.add('in')));
    } else if (mode === 'flow') {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
      chapters.forEach((c) => c.items.forEach((el) => io.observe(el)));
    } else {
      measure();
      update();
    }
    dropHello();
  }

  /* ---------- hello: objects drop in one by one on load ---------- */
  function dropHello() {
    const drops = document.querySelectorAll('.ch-hello .drop');
    if (mode === 'still') { drops.forEach((el) => el.classList.add('in')); return; }
    drops.forEach((el) => el.classList.remove('in'));
    // two frames so the hidden state is painted before the transition starts
    requestAnimationFrame(() => requestAnimationFrame(() => drops.forEach((el) => el.classList.add('in'))));
  }

  /* ---------- pinned: scroll progress → step ---------- */
  function measure() {
    const vh = window.innerHeight;
    chapters.forEach((c) => {
      const top = c.ch.getBoundingClientRect().top + window.scrollY;
      c.start = top - vh * 0.4;                    // first card arrives as the stage slides in
      c.end = top + c.ch.offsetHeight - vh;        // the moment the stage un-pins
      // where each artefact bursts out from: under the middle of the stage
      c.items.forEach((el) => {
        const p = el.offsetParent;
        if (!p) return;
        el.style.setProperty('--fx', `${Math.round(p.clientWidth / 2 - el.offsetLeft)}px`);
        el.style.setProperty('--fy', `${Math.round(p.clientHeight / 2 - el.offsetTop)}px`);
      });
    });
    avoidHeads();
  }

  // nothing on the desk may sit on a heading or its intro text: measure where each
  // artefact ends up and, if it would touch the heading, nudge it down or right
  function avoidHeads() {
    root.classList.add('probing');
    try { chapters.forEach((c) => {
      const head = c.ch.querySelector('.ch-head');
      if (!head) return;
      const items = [...c.ch.querySelectorAll('[data-step], .talk .chip')]
        .filter((el) => !el.closest('.ch-head, .scrapbook') && !el.matches('.talk'));
      const saved = items.map((el) => el.getAttribute('class'));
      items.forEach((el) => { el.style.setProperty('--nx', '0px'); el.style.setProperty('--ny', '0px'); el.classList.add('in', 'current'); });
      const h = head.getBoundingClientRect();
      const pad = 16;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.right < h.left - pad || r.left > h.right + pad || r.bottom < h.top - pad || r.top > h.bottom + pad) return;
        const down = h.bottom + pad - r.top, right = h.right + pad - r.left;
        if (down <= right) el.style.setProperty('--ny', `${Math.round(down)}px`);
        else el.style.setProperty('--nx', `${Math.round(right)}px`);
      });
      items.forEach((el, i) => el.setAttribute('class', saved[i]));
    }); } finally {
    root.offsetHeight; // apply the restored state before transitions come back
    root.classList.remove('probing'); }
  }

  function progress(c, y) {
    return (y - c.start) / (c.end - c.start);
  }

  function stepFor(c, y) {
    const q = progress(c, y);
    if (q <= 0) return 0;
    return Math.min(c.n, Math.floor(q * c.n) + 1);
  }

  function apply(c, step) {
    c.step = step;
    c.ch.dataset.at = String(step);
    c.items.forEach((el) => {
      const k = Number(el.dataset.step);
      el.classList.toggle('in', step >= k);
      el.classList.toggle('current', step === k);
      el.classList.toggle('past', step > k);
    });
  }

  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    if (mode === 'pinned') {
      chapters.forEach((c) => {
        const step = stepFor(c, y);
        if (step !== c.step) apply(c, step);
        // slow drift of the big background word
        if (c.bg && y > c.start - vh && y < c.end + vh) {
          const q = Math.max(-0.3, Math.min(1.3, progress(c, y)));
          c.bg.style.transform = `translate3d(${(-q * 9).toFixed(2)}vw, 0, 0)`;
        }
      });
    }

    // "03 · speaking" label
    const mid = y + vh / 2;
    let current = sections[0];
    for (const s of sections) {
      if (s.getBoundingClientRect().top + y <= mid) current = s;
    }
    if (current !== lastSection) {
      lastSection = current;
      wamNum.textContent = String(sections.indexOf(current) + 1).padStart(2, '0');
      wamName.textContent = current.dataset.name;
      wamLinks.forEach((a) => {
        if (a.hash === '#' + current.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  /* ---------- keyboard: tabbing to a hidden card scrolls the story to it ---------- */
  document.addEventListener('focusin', (e) => {
    if (mode !== 'pinned') return;
    const item = e.target.closest && e.target.closest('[data-step]');
    if (!item) return;
    const c = chapters.find((ch) => ch.ch.contains(item));
    if (!c) return;
    const k = Number(item.dataset.step);
    const needsCurrent = c.ch.dataset.focus === 'current';
    const visible = needsCurrent ? c.step === k : c.step >= k;
    if (visible) return;
    const target = c.start + ((k - 0.5) / c.n) * (c.end - c.start);
    requestAnimationFrame(() => {
      window.scrollTo({ top: Math.round(target), behavior: 'instant' });
      update();
    });
  });

  /* ---------- dialogs ---------- */
  let opener = null;

  function openDialog(dialog, from) {
    opener = from;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const close = dialog.querySelector('.modal-close');
    if (close) close.focus();
  }

  document.querySelectorAll('dialog.modal').forEach((dialog) => {
    dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
    // click on the backdrop (the dialog box itself, outside the paper) closes it
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      if (opener) opener.focus({ preventScroll: true });
      opener = null;
    });
  });

  const talkModal = document.getElementById('talkModal');
  document.querySelectorAll('.talk-open').forEach((btn) => {
    btn.addEventListener('click', () => {
      const talk = btn.closest('.talk');
      talkModal.querySelector('h3').textContent = btn.textContent.trim();
      const abstract = talkModal.querySelector('.modal-abstract');
      abstract.innerHTML = '';
      [...talk.querySelector('.abstract').children].forEach((p) => abstract.appendChild(p.cloneNode(true)));
      const where = talkModal.querySelector('.modal-where');
      where.innerHTML = '';
      talk.querySelectorAll('.chips .chip').forEach((chip) => {
        const li = document.createElement('li');
        li.className = 'chip';
        li.innerHTML = chip.innerHTML;
        where.appendChild(li);
      });
      openDialog(talkModal, btn);
    });
  });

  const zoomModal = document.getElementById('zoomModal');
  const zoomImg = zoomModal.querySelector('img');
  document.querySelectorAll('.zoomable').forEach((btn) => {
    const img = btn.querySelector('img');
    btn.setAttribute('aria-label', `Enlarge photo: ${img.alt}`);
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.addEventListener('click', () => {
      zoomImg.src = img.currentSrc || img.src;
      zoomImg.alt = img.alt;
      openDialog(zoomModal, btn);
    });
  });

  /* ---------- pigeon: squash, hop ~26px with a lean, land, squash ---------- */
  document.querySelectorAll('.pigeon').forEach((pigeon) => {
    const bird = pigeon.querySelector('.pg-bird');
    const shadow = pigeon.querySelector('.pg-shadow');
    let hopping = false;
    pigeon.addEventListener('click', () => {
      if (hopping) return;
      if (mqStill.matches || !bird.animate) {
        // reduced motion: no hop, just a coo
        pigeon.classList.add('hop');
        setTimeout(() => pigeon.classList.remove('hop'), 900);
        return;
      }
      hopping = true;
      pigeon.classList.add('hop');
      const t = { duration: 650, easing: 'linear' };
      bird.animate([
        { offset: 0,    transform: 'translateY(0) rotate(0deg) scale(1, 1)', easing: 'ease-out' },
        { offset: 0.14, transform: 'translateY(0) rotate(0deg) scale(1.1, .86)', easing: 'cubic-bezier(.2,.7,.4,1)' },
        { offset: 0.48, transform: 'translateY(-26px) rotate(-7deg) scale(.95, 1.06)', easing: 'cubic-bezier(.6,0,.85,.45)' },
        { offset: 0.78, transform: 'translateY(0) rotate(-2deg) scale(1, 1)', easing: 'ease-out' },
        { offset: 0.88, transform: 'translateY(0) rotate(0deg) scale(1.1, .88)', easing: 'ease-out' },
        { offset: 1,    transform: 'translateY(0) rotate(0deg) scale(1, 1)' },
      ], t);
      shadow.animate([
        { offset: 0,    transform: 'scale(1)',   opacity: 0.5 },
        { offset: 0.14, transform: 'scale(1.08)', opacity: 0.55 },
        { offset: 0.48, transform: 'scale(.58)', opacity: 0.22 },
        { offset: 0.78, transform: 'scale(1)',   opacity: 0.5 },
        { offset: 0.88, transform: 'scale(1.1)', opacity: 0.55 },
        { offset: 1,    transform: 'scale(1)',   opacity: 0.5 },
      ], t).onfinish = () => { hopping = false; pigeon.classList.remove('hop'); };
    });
  });

  /* ---------- section nav ---------- */
  function setMenu(open, focusBtn) {
    wamMenu.hidden = !open;
    wamBtn.setAttribute('aria-expanded', String(open));
    if (open) (wamMenu.querySelector('[aria-current]') || wamLinks[0]).focus();
    else if (focusBtn) wamBtn.focus();
  }
  wamBtn.addEventListener('click', () => setMenu(wamMenu.hidden));
  // every in-page link (menu, receipt, desk objects) jumps rather than smooth-scrolls,
  // so we don't flick through every chapter's pops on the way. Chapters marked
  // data-land="end" (say hi) land on their last step so the letter is already out.
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hash.length < 2) return;
    const target = document.querySelector(a.hash);
    if (!target) return;
    e.preventDefault();
    if (!wamMenu.hidden) setMenu(false);
    let top = target.getBoundingClientRect().top + window.scrollY;
    const c = chapters.find((ch) => ch.ch === target);
    if (mode === 'pinned' && c && target.dataset.land === 'end') { measure(); top = c.end - 2; }
    window.scrollTo({ top: Math.round(top), behavior: 'instant' });
    history.replaceState(null, '', a.hash);
    update();
  });
  wamMenu.addEventListener('keydown', (e) => {
    const i = wamLinks.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = wamLinks.length;
      wamLinks[(i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n].focus();
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wamMenu.hidden) setMenu(false, true); });
  document.addEventListener('click', (e) => { if (!wamMenu.hidden && !e.target.closest('.where-am-i')) setMenu(false); });
  document.addEventListener('focusin', (e) => { if (!wamMenu.hidden && !e.target.closest('.where-am-i')) setMenu(false); });

  /* ---------- wire up ---------- */
  setMode();
  const onMQ = () => setMode();
  [mqPin, mqStill].forEach((mq) => (mq.addEventListener ? mq.addEventListener('change', onMQ) : mq.addListener(onMQ)));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { if (mode === 'pinned') measure(); onScroll(); });
  window.addEventListener('load', () => { if (mode === 'pinned') { measure(); update(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (mode === 'pinned') { measure(); update(); } });
  update();
  // ---------- receipt footer ----------
  (() => {
    const till = document.querySelector('.till');
    if (!till) return;
    till.querySelectorAll('[data-count]').forEach((el) => {
      const n = document.querySelectorAll(el.dataset.count).length;
      if (n) el.textContent = n;
    });
    const time = document.getElementById('tillTime');
    const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    const stamp = () => { time.textContent = fmt.format(new Date()).toUpperCase().replace(',', ' ·'); };
    // what this visit actually downloaded (cached files count as 0, so it can be tiny on a revisit)
    const weightEl = document.getElementById('tillWeight');
    const weigh = () => {
      const entries = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
      const bytes = entries.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0);
      weightEl.textContent = bytes > 1e6 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    };
    const print = () => { stamp(); weigh(); till.classList.add('printed'); };
    if (!('IntersectionObserver' in window)) { print(); return; }
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { print(); seen.disconnect(); }
    }, { threshold: 0.15 });
    seen.observe(till);
  })();
  // ---------- whimsy: sprinkle a few twinkling sparkles round each section ----------
  (() => {
    const svgNS = 'http://www.w3.org/2000/svg';
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    // keep to the edges and the top band so they never sit on the cards
    const spot = () => {
      const r = rnd();
      if (r < .4) return [3 + rnd() * 14, 20 + rnd() * 70];      // left edge
      if (r < .8) return [83 + rnd() * 14, 20 + rnd() * 70];     // right edge
      return [30 + rnd() * 40, 4 + rnd() * 10];                  // top band
    };
    const sparkle = (x, y) => {
      const s = document.createElementNS(svgNS, 'svg');
      s.setAttribute('class', 'sparkle' + (rnd() < .35 ? ' pink' : ''));
      s.setAttribute('aria-hidden', 'true');
      s.style.cssText = `--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--s:${(16 + rnd() * 14).toFixed(0)}px;--r:${(rnd() * 40 - 20).toFixed(0)}deg;--tw:${(2.6 + rnd() * 2.4).toFixed(1)}s;--twd:${(-rnd() * 4).toFixed(1)}s`;
      const u = document.createElementNS(svgNS, 'use');
      u.setAttribute('href', '#star');
      s.append(u);
      return s;
    };
    document.querySelectorAll('.ch > .stage').forEach((stage) => {
      for (let i = 0; i < 4; i++) stage.append(sparkle(...spot()));
    });
    const till = document.querySelector('.till');
    if (till) {
      const box = document.createElement('div');
      box.className = 'till-sparkles';
      // dotted round the receipt (px from the middle, % down)
      [[-215, 22], [205, 14], [-235, 62], [228, 48], [-190, 88], [200, 82]].forEach(([dx, y]) => {
        const s = sparkle(0, y);
        s.style.setProperty('--x', `calc(50% + ${dx}px)`);
        box.append(s);
      });
      till.append(box);
    }
  })();
  // ---------- desk: drag any artefact around (desktop story only) ----------
  (() => {
    const SEL = '.stage :is(.sticker-obj, .clutter, .star, .note, .bake, .role, .pcards > li, .chip.link, .envelope, .obj, .sparkle)';
    document.querySelectorAll(SEL).forEach((el) => {
      el.classList.add('drag');
      el.setAttribute('draggable', 'false');
      el.querySelectorAll('img, a').forEach((x) => x.setAttribute('draggable', 'false'));
    });
    let z = 30, drag = null, swallowClick = false;
    document.addEventListener('pointerdown', (e) => {
      if (mode !== 'pinned' || e.button !== 0) return;
      const el = e.target.closest && e.target.closest('.drag');
      if (!el) return;
      const cs = getComputedStyle(el);
      drag = {
        el, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false,
        dx: parseFloat(cs.getPropertyValue('--dx')) || 0,
        dy: parseFloat(cs.getPropertyValue('--dy')) || 0,
      };
    });
    document.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const mx = e.clientX - drag.x, my = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(mx, my) < 4) return;
        drag.moved = true;
        drag.el.classList.add('dragging');
        drag.el.style.zIndex = ++z;                 // picked-up things land on top
        try { drag.el.setPointerCapture(e.pointerId); } catch (err) {}
      }
      drag.el.style.setProperty('--dx', `${drag.dx + mx}px`);
      drag.el.style.setProperty('--dy', `${drag.dy + my}px`);
    });
    const drop = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) { swallowClick = true; drag.el.classList.remove('dragging'); }
      drag = null;
    };
    document.addEventListener('pointerup', drop);
    document.addEventListener('pointercancel', drop);
    // a drag shouldn't also open the photo or follow the link
    document.addEventListener('click', (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault(); e.stopPropagation();
    }, true);
    document.addEventListener('dragstart', (e) => { if (e.target.closest && e.target.closest('.drag')) e.preventDefault(); });
  })();
  // ---------- side projects open on a laptop / phone and load for real ----------
  (() => {
    const modal = document.getElementById('deviceModal');
    if (!modal) return;
    const device = modal.querySelector('.device');
    const viewport = modal.querySelector('.viewport');
    const openLink = modal.querySelector('.device-open');
    const NATIVE = { laptop: 1280, phone: 390 };   // the width each site thinks it has
    let frame = null, timer = 0;
    const clock = () => {
      modal.querySelector('.sb-time').textContent = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date());
    };
    const fit = () => {
      if (!frame) return;
      const kind = device.classList.contains('phone') ? 'phone' : 'laptop';
      const k = viewport.clientWidth / NATIVE[kind];
      frame.style.width = `${NATIVE[kind]}px`;
      frame.style.height = `${Math.ceil(viewport.clientHeight / k)}px`;
      frame.style.transform = `scale(${k})`;
    };
    function open(card) {
      const kind = card.dataset.device === 'phone' ? 'phone' : 'laptop';
      const url = card.href;
      const name = card.querySelector('.pname').textContent.replace('↗', '').trim();
      device.className = `device ${kind} loading`;
      modal.querySelector('.loader-name').textContent = name;
      modal.querySelector('.url').textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      openLink.href = url;
      clock();
      viewport.innerHTML = '';
      openDialog(modal, card);
      frame = document.createElement('iframe');
      frame.title = name;
      frame.setAttribute('loading', 'eager');
      const shown = Date.now();
      frame.addEventListener('load', () => {
        // let the little loading bar have its moment
        clearTimeout(timer);
        timer = setTimeout(() => device.classList.add('loaded'), Math.max(0, 1100 - (Date.now() - shown)));
      });
      viewport.append(frame);
      fit();
      frame.src = url;
    }
    document.addEventListener('click', (e) => {
      const card = e.target.closest && e.target.closest('.pcard');
      if (!card || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      if (window.innerWidth < 720) return;   // on a phone, just go to the site
      e.preventDefault();
      open(card);
    });
    window.addEventListener('resize', fit);
    modal.addEventListener('close', () => { clearTimeout(timer); viewport.innerHTML = ''; frame = null; });
  })();
})();
