/* fadila.exe — window manager + pixel icons (no dependencies) */
(() => {
  'use strict';

  /* ---------- pixel sprites: 12x12 grids, one char per pixel ---------- */
  const COLORS = {
    o: '#7a6481', p: '#f2cfe0', h: '#e5a3c4', b: '#cfe4f2', y: '#f7efc6',
    w: '#fffdfb', m: '#cdeadb', l: '#ddd2ee', r: '#ee9aae', n: '#dcb98f'
  };
  const PIGEON = [
    '....kkkk........',
    '...kggggk.......',
    '.kkgggegk.......',
    'kbbkgggggk......',
    '.kkkngnnnkk.....',
    '..kgnnnngggk....',
    '..kggggggggggk..',
    '.kggddgggddggggk',
    '.kgwddddddddgggk',
    '.kgwwdddddddggk.',
    '..kgwwwwggggkk..',
    '...kkggggggkk...',
    '.....kkkkkk.....',
    '......f..f......'
  ];
  const PIGEON_COLORS = { k: '#7a6481', g: '#d3d6df', d: '#a9aec2', w: '#f0f1f6', n: '#b9d6c8', e: '#e9a56b', b: '#dba08f', f: '#e8aebd' };
  const SPRITES = {
    mic: [
      '...oooooo...','..opppppho..','..opwwpppo..','..opppppho..','..opppppho..','.oopppppooo.',
      '.o.oooooo.o.','..o......o..','...oooooo...','.....oo.....','.....oo.....','...oooooo...'
    ],
    floppy: [
      '.oooooooooo.','obbboooobbbo','obbboppobbbo','obbboppobbbo','obbbbbbbbbbo','obwwwwwwwwbo',
      'obwwwwwwwwbo','obwlllllllwo','obwwwwwwwwbo','obwwwwwwwwbo','oooooooooooo'
    ],
    smile: [
      '...oooooo...', '.ooyyyyyyoo.', 'oyyyyyyyyyyo', 'oyyoyyyyoyyo', 'oyyoyyyyoyyo', 'oyyyyyyyyyyo',
      'oyryyyyyyryo', 'oyyrooooryyo', '.oyyyyyyyyo.', '..oooooooo..'
    ],
    briefcase: [
      '....oooo....', '....o..o....', 'oooooooooooo', 'obbbbbbbbbbo', 'obbbbyybbbbo', 'oooooyyooooo',
      'obbbbyybbbbo', 'obbbbbbbbbbo', 'oooooooooooo'
    ],
    camera: [
      '...oooo.....', 'oooooooooooo', 'ophhhhhhhhyo', 'ophooooooopo', 'opooowwwoopo', 'opooowwwoopo',
      'ophooooooopo', 'ophhhhhhhhho', 'oooooooooooo'
    ],
    cupcake: [
      '.....oo.....', '....orro....', '...owwwwo...', '..owwpwwwo..', '..owwwwwwo..', '.oooooooooo.',
      '.oyyoyyoyyo.', '..oyyoyyyyo.', '...oyyoyyo..', '....oooooo..'
    ],
    palette: [
      '...oooooo...', '.oowwwwwwoo.', 'owrrwwwyywwo', 'owrrwwwyywwo', 'owwwbbwwwwwo', 'owwwbbwwwwoo',
      'owwwwwwwwwo.', '.owwwwwwooo.', '..ooooooo...'
    ],
    heart: [
      '..ooo..ooo..', '.orrro.orrro', 'orwrrrrrrrro', 'orrrrrrrrrro', 'orrrrrrrrrro', '.orrrrrrrro.',
      '..orrrrrro..', '...orrrro...', '....orro....', '.....oo.....'
    ],
    star: [
      '.....oo.....', '.....oo.....', '....oyyo....', 'oooooyyooooo', 'oyyyyyyyyyyo', '.oyyyyyyyyo.',
      '..oyyyyyyo..', '..oyyoyyyo..', '.oyyo..oyyo.', '.ooo....ooo.'
    ]
  };

  function sprite(name) {
    const rows = SPRITES[name] || SPRITES.star;
    let rects = '';
    rows.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[c]}"/>`;
      });
    });
    return rects;
  }
  const OBJ = { briefcase: 'bag', camera: 'camera', cupcake: 'croissant', palette: 'palette',
                heart: 'envelope', mic: 'mic', floppy: 'typewriter', keyboard: 'keyboard' };
  const SMILE = '<svg class="pix obj" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.8 2.5 2.6 4 2.6s3-.8 4-2.6"/><path d="M9 9.5v.5M15 9.5v.5"/></svg>';
  const svg = (name, cls = 'pix') =>
    OBJ[name] ? `<img class="${cls} obj" src="images/obj-${OBJ[name]}.png" alt="" aria-hidden="true" draggable="false">`
    : name === 'smile' ? SMILE
    : `<svg class="${cls}" viewBox="0 0 12 12" aria-hidden="true">${sprite(name)}</svg>`;

  /* ---------- state ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const desktop = $('#desktop');
  const iconsEl = $('#icons');
  const tasksEl = $('#tasks');
  const startMenu = $('#startMenu');
  const startBtn = $('#startBtn');
  const startList = $('#startList');
  const wins = [...document.querySelectorAll('.win')];
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
  let zTop = 10;
  let cascade = 0;

  $('#startIcon').innerHTML = sprite('star');

  /* ---------- pet seagull (Fadila's own photo): crouch on hover, hop on click ---------- */
  (() => {
    const b = document.createElement('button');
    b.className = 'pigeon';
    b.setAttribute('aria-label', 'A seagull. Click to make it hop.');
    b.innerHTML = '<span class="pg-coo" aria-hidden="true">Can we be friends?</span><span class="pg-shadow" aria-hidden="true"></span><img class="pg-bird" src="images/obj-gull.png" alt="" draggable="false">';
    document.body.appendChild(b);
    const bird = b.querySelector('.pg-bird'), shadow = b.querySelector('.pg-shadow');
    let hopping = false;
    b.addEventListener('click', () => {
      if (hopping || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !bird.animate) return;
      hopping = true; b.classList.add('hop');
      const t = { duration: 650, easing: 'ease-in-out' };
      bird.animate([
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(2px) scale(1.08, .88)', offset: .15 },
        { transform: 'translateY(-26px) rotate(-6deg) scale(.96, 1.05)', offset: .45 },
        { transform: 'translateY(0) rotate(0) scale(1.06, .92)', offset: .8 },
        { transform: 'translateY(0) scale(1, 1)' }
      ], t);
      shadow.animate([
        { transform: 'scale(1)', opacity: .5 }, { transform: 'scale(1.1)', opacity: .55, offset: .15 },
        { transform: 'scale(.55)', opacity: .22, offset: .45 }, { transform: 'scale(1.1)', opacity: .55, offset: .8 },
        { transform: 'scale(1)', opacity: .5 }
      ], t).onfinish = () => { hopping = false; b.classList.remove('hop'); };
    });
  })();

  /* ---------- build UI for every window ---------- */
  wins.forEach((win) => {
    const id = win.id;
    const title = win.dataset.title;
    const icon = win.dataset.icon;
    const w = parseInt(win.dataset.w || '480', 10);
    win.style.width = w + 'px';
    win.style.left = (win.dataset.x || 120) + 'px';
    win.style.top = (win.dataset.y || 40) + 'px';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', title);

    // title bar
    const bar = document.createElement('div');
    bar.className = 'titlebar';
    bar.innerHTML = `${svg(icon)}<span class="ttl">${title}</span>
      <button class="wbtn minbtn" aria-label="Minimise ${title}">_</button>
      <button class="wbtn maxbtn" aria-label="Maximise ${title}">□</button>
      <button class="wbtn closebtn" aria-label="Close ${title}">✕</button>`;
    win.prepend(bar);

    // desktop icon (the about icon only shows on phones, where it isn't auto-opened)
    {
      const b = document.createElement('button');
      b.className = 'icon' + (id === 'about' ? ' about-icon' : '');
      b.dataset.target = id;
      b.innerHTML = `${svg(icon)}<span>${title}</span>`;
      b.addEventListener('click', () => openWin(id));
      iconsEl.appendChild(b);
    }

    // start menu item
    const li = document.createElement('li');
    li.innerHTML = `<button data-target="${id}">${svg(icon)}${title}</button>`;
    li.firstChild.addEventListener('click', () => { openWin(id); toggleStart(false); });
    startList.appendChild(li);

    // taskbar button
    const t = document.createElement('button');
    t.className = 'task';
    t.id = 'task-' + id;
    t.hidden = true;
    t.innerHTML = `${svg(icon)}<span>${title}</span>`;
    t.addEventListener('click', () => {
      if (win.classList.contains('focus') && win.classList.contains('open')) minimise(id);
      else openWin(id);
    });
    tasksEl.appendChild(t);

    // window controls
    bar.querySelector('.closebtn').addEventListener('click', () => closeWin(id));
    bar.querySelector('.minbtn').addEventListener('click', () => minimise(id));
    bar.querySelector('.maxbtn').addEventListener('click', () => toggleMax(win));
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.wbtn')) toggleMax(win); });
    win.addEventListener('pointerdown', () => focusWin(id));

    enableDrag(win, bar);
  });

  /* ---------- window actions ---------- */
  function focusWin(id) {
    wins.forEach((w) => {
      const on = w.id === id;
      w.classList.toggle('focus', on);
      $('#task-' + w.id).classList.toggle('focus', on && w.classList.contains('open'));
    });
    const win = document.getElementById(id);
    win.style.zIndex = ++zTop;
  }
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE_OUT = 'cubic-bezier(.2,.9,.3,1.15)';
  function stopAnim(win) { if (win._anim) { win._anim.cancel(); win._anim = null; } }
  function flyTo(win, id, done) {
    stopAnim(win);
    if (reduceMotion() || typeof win.animate !== 'function') return done();
    const w = win.getBoundingClientRect(), t = $('#task-' + id).getBoundingClientRect();
    const dx = (t.left + t.width / 2) - (w.left + w.width / 2);
    const dy = (t.top + t.height / 2) - (w.top + w.height / 2);
    win._anim = win.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: 0 }],
      { duration: 240, easing: 'cubic-bezier(.5,0,.9,.5)' });
    win._anim.onfinish = () => { win._anim = null; done(); };
  }

  /* ---------- place a newly opened window in the emptiest spot ---------- */
  function placeInEmptySpace(win) {
    const D = desktop.getBoundingClientRect();
    const ic = iconsEl.getBoundingClientRect();
    const pad = 12, step = 24;
    const w = win.offsetWidth;
    const h = Math.min(win.offsetHeight, D.height - pad * 2);
    const minX = Math.round(ic.right - D.left) + pad;
    const maxX = Math.max(minX, D.width - w - pad);
    const maxY = Math.max(pad, D.height - h - pad);
    const others = wins.filter((o) => o !== win && o.classList.contains('open') && !o.classList.contains('max'))
      .map((o) => { const r = o.getBoundingClientRect(); return { x: r.left - D.left, y: r.top - D.top, w: r.width, h: r.height }; });
    const overlap = (x, y) => others.reduce((sum, o) => {
      const ox = Math.max(0, Math.min(x + w, o.x + o.w) - Math.max(x, o.x));
      const oy = Math.max(0, Math.min(y + h, o.y + o.h) - Math.max(y, o.y));
      return sum + ox * oy;
    }, 0);
    let best = { x: minX, y: pad, s: Infinity };
    for (let y = pad; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        // least overlap wins; ties go to the spot nearest the top-left
        const s = overlap(x, y) * 1000 + y + x * 0.5;
        if (s < best.s) best = { x, y, s };
      }
    }
    win.style.left = best.x + 'px';
    win.style.top = best.y + 'px';
  }

  function openWin(id, moveFocus = true) {
    const win = document.getElementById(id);
    if (!win.classList.contains('open') || win._anim) {
      stopAnim(win);
      const wasClosed = !win.classList.contains('open');
      win.classList.add('open');
      if (wasClosed && !isMobile() && !win.classList.contains('max')) placeInEmptySpace(win);
      if (!reduceMotion() && typeof win.animate === 'function') {
        win._anim = win.animate(
          [{ transform: 'translateY(14px) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 280, easing: EASE_OUT });
        win._anim.onfinish = () => { win._anim = null; };
      }
    }
    $('#task-' + id).hidden = false;
    focusWin(id);
    if (moveFocus) {
      const h = win.querySelector('.win-body h1, .win-body h2');
      if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    }
  }
  function closeWin(id) {
    const win = document.getElementById(id);
    stopAnim(win);
    win.classList.remove('focus');
    $('#task-' + id).hidden = true;
    // if focus was inside this window, hand it back to its desktop icon
    if (win.contains(document.activeElement)) { const ic = document.querySelector(`.icon[data-target="${id}"]`); if (ic) ic.focus(); }
    const finish = () => { win.classList.remove('open', 'max'); };
    if (reduceMotion() || typeof win.animate !== 'function') return finish();
    win._anim = win.animate(
      [{ transform: 'none', opacity: 1 }, { transform: 'scale(.9)', opacity: 0 }],
      { duration: 160, easing: 'ease-in' });
    win._anim.onfinish = () => { win._anim = null; finish(); };
  }
  function minimise(id) {
    const win = document.getElementById(id);
    win.classList.remove('focus');
    $('#task-' + id).classList.remove('focus');
    flyTo(win, id, () => win.classList.remove('open'));
  }
  function toggleMax(win) {
    win.classList.toggle('max');
    if (reduceMotion() || typeof win.animate !== 'function') return;
    stopAnim(win);
    win._anim = win.animate([{ transform: 'scale(.96)', opacity: .85 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: EASE_OUT });
    win._anim.onfinish = () => { win._anim = null; };
  }

  /* ---------- dragging (mouse + touch via pointer events) ---------- */
  function enableDrag(win, bar) {
    let sx, sy, ox, oy, dx = 0, dy = 0, dragging = false, raf = 0;
    const apply = () => { raf = 0; win.style.transform = `translate3d(${dx}px, ${dy}px, 0)`; };
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.wbtn') || isMobile() || win.classList.contains('max')) return;
      stopAnim(win);
      dragging = true; dx = 0; dy = 0;
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      win.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxX = desktop.clientWidth - 60;
      const maxY = desktop.clientHeight - 40;
      const nx = Math.max(-win.offsetWidth + 80, Math.min(maxX, ox + e.clientX - sx));
      const ny = Math.max(0, Math.min(maxY, oy + e.clientY - sy));
      dx = nx - ox; dy = ny - oy;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    const stop = () => {
      if (!dragging) return;
      dragging = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      win.style.left = (ox + dx) + 'px';
      win.style.top = (oy + dy) + 'px';
      win.style.transform = '';
      win.classList.remove('dragging');
    };
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  }

  /* ---------- start menu ---------- */
  function toggleStart(force) {
    const show = typeof force === 'boolean' ? force : startMenu.hidden;
    startMenu.hidden = !show;
    startBtn.setAttribute('aria-expanded', String(show));
  }
  startBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleStart(); });
  document.addEventListener('click', (e) => {
    if (!startMenu.hidden && !startMenu.contains(e.target)) toggleStart(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleStart(false);
      if ([...document.querySelectorAll('.zoom')].some((z) => !z.hidden)) return; // a pop-up handles its own Escape
      const focused = wins.find((w) => w.classList.contains('focus') && w.classList.contains('open'));
      if (focused) closeWin(focused.id);
    }
  });

  /* ---------- clock ---------- */
  const clock = $('#clock');
  // Fadila's time is always Sydney. Visitors in another time zone also see their own.
  const fmt = (tz) => new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, ...(tz ? { timeZone: tz } : {}) }).toLowerCase();
  const tick = () => {
    const mine = fmt('Australia/Sydney'), yours = fmt();
    clock.innerHTML = mine === yours
      ? `<span title="Sydney time">${mine}</span>`
      : `<span title="Fadila's time (Sydney)">My time <b>${mine}</b></span><span class="sep">·</span><span title="Your local time">Your time <b>${yours}</b></span>`;
  };
  tick(); setInterval(tick, 15000);

  /* ---------- open the windows marked data-open ---------- */
  if (!isMobile()) wins.forEach((w) => { if (w.dataset.open === 'true') openWin(w.id, false); });

  /* ---------- font tester: add ?font=nunito (etc.) to the URL ---------- */
  (() => {
    const F = {
      nunito: ['Nunito', 'Nunito:wght@400;600;700'],
      quicksand: ['Quicksand', 'Quicksand:wght@400;600;700'],
      dmsans: ['DM Sans', 'DM+Sans:wght@400;500;700'],
      dmmono: ['DM Mono', 'DM+Mono:wght@400;500'],
      spacemono: ['Space Mono', 'Space+Mono:wght@400;700'],
      silkscreen: ['Silkscreen', 'Silkscreen:wght@400;700'],
      pixelify: ['Pixelify Sans', 'Pixelify+Sans:wght@400;500;600']
    };
    const pick = F[new URLSearchParams(location.search).get('font')];
    if (!pick) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + pick[1] + '&display=swap';
    document.head.appendChild(l);
    const css = `'${pick[0]}', sans-serif`;
    document.documentElement.style.setProperty('--font-pixel', css);
    document.documentElement.style.setProperty('--font-body', css);
  })();

  /* ---------- click a photo to zoom ---------- */
  (() => {
    const box = document.createElement('div');
    box.className = 'zoom'; box.hidden = true;
    box.innerHTML = '<figure class="zoom-card"><button class="zoom-x" aria-label="Close">×</button><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);
    const img = box.querySelector('img'), cap = box.querySelector('figcaption');
    box.querySelector('.zoom-card').setAttribute('role', 'dialog');
    box.querySelector('.zoom-card').setAttribute('aria-modal', 'true');
    box.querySelector('.zoom-card').setAttribute('aria-label', 'Enlarged photo');
    const close = () => { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 180); if (lastTile) lastTile.focus(); };
    const open = (src, alt, text) => {
      img.src = src; img.alt = alt || ''; cap.textContent = text || '';
      box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
      box.querySelector('.zoom-x').focus();
    };
    const tiles = '.shot, .canvas .ph';
    document.querySelectorAll(tiles).forEach(t => {
      t.tabIndex = 0; t.setAttribute('role', 'button');
      const i = t.querySelector('img'); if (i) t.setAttribute('aria-label', 'Enlarge: ' + i.alt);
    });
    let lastTile = null;
    const fire = t => {
      lastTile = t;
      const i = t.querySelector('img'); if (!i) return;
      const f = t.closest('figure'), c = f && f.querySelector('figcaption');
      open(i.currentSrc || i.src, i.alt, c ? c.innerText.replace(/\n/g, ' · ') : '');
    };
    document.addEventListener('click', e => { const t = e.target.closest(tiles); if (t) fire(t); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !box.hidden) close();
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(tiles)) { e.preventDefault(); fire(e.target); }
    });
    box.addEventListener('click', close);
  })();

  /* ---------- click a talk for the full abstract ---------- */
  (() => {
    const box = document.createElement('div');
    box.className = 'zoom talk-pop'; box.hidden = true;
    box.innerHTML = '<article class="zoom-card talk-card" role="dialog" aria-modal="true" aria-labelledby="talkTitle"><button class="zoom-x" aria-label="Close">×</button><div class="talk-body"></div></article>';
    document.body.appendChild(box);
    const body = box.querySelector('.talk-body');
    let last = null;
    const close = () => { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 180); if (last) last.focus(); };
    const open = (t) => {
      last = t.querySelector('.talk-open') || t;
      body.innerHTML = '<p class="kicker">Talk</p><h3 id="talkTitle">' + t.querySelector('h3').textContent + '</h3>' +
        t.querySelector('.abstract').innerHTML +
        '<p class="kicker">Presented at</p>' + t.querySelector('.where-list').outerHTML;
      box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
      box.querySelector('.zoom-x').focus();
    };
    document.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const t = e.target.closest('.talk'); if (t) open(t);   // whole card for mouse users; the title is the real button
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !box.hidden) close();
    });
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.zoom-x')) close(); });
  })();

  /* ---------- sticky note: a random little bit of philosophy / hope ---------- */
  (() => {
    const note = $('#sticky'); if (!note) return;
    const NOTES = [
      'You are doing better than you think.',
      'Small steps still count.',
      'Rest is productive too.',
      'You don’t have to be perfect to be good.',
      'It’s okay to start again.',
      'Be proud of how far you’ve come.',
      'Drink some water.',
      'Go outside and look at the sky.',
      'Make something just because it makes you happy.',
      'Bread takes time. So do you.',
      'You are allowed to take up space.',
      'One thing at a time.',
      'Today is a good day to be kind to yourself.',
      'Good things are coming.',
      'You’ve got this.'
    ];
    let last = -1;
    const pick = () => {
      let i; do { i = Math.floor(Math.random() * NOTES.length); } while (i === last && NOTES.length > 1);
      last = i;
      $('#stickyText').textContent = NOTES[i];
    };
    pick();
    $('#stickyNew').addEventListener('click', () => {
      pick();
      if (!reduceMotion() && note.animate) note.animate([{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    });
    $('#stickyClose').addEventListener('click', () => { note.hidden = true; });

    // drag by the top strip, like the real thing
    const bar = note.querySelector('.sticky-bar');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || isMobile()) return;
      const r = note.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      const move = (ev) => {
        note.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + 'px';
        note.style.top = Math.max(0, ev.clientY - dy) + 'px';
        note.style.right = 'auto';
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up);
    });
  })();

  /* ---------- buttons that open another window ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-win]'); if (b) openWin(b.dataset.openWin);
  });

  /* ---------- skip link: jump into the front-most open window ---------- */
  $('#skipLink').addEventListener('click', (e) => {
    e.preventDefault();
    const open = wins.filter((w) => w.classList.contains('open')).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    if (open) openWin(open.id); else openWin('about');
  });

  /* ---------- weather where the visitor is (GeoJS + Open-Meteo, no API keys) ---------- */
  (() => {
    const el = $('#weather'); if (!el) return;
    const icon = (code, day) =>
      code === 0 ? (day ? '☀' : '☾') :
      code <= 2 ? (day ? '⛅' : '☁') :
      code === 3 || code === 45 || code === 48 ? '☁' :
      code >= 95 ? '⛈' :
      (code >= 71 && code <= 77) || code === 85 || code === 86 ? '❄' : '☂';
    const label = (code) =>
      code === 0 ? 'clear' : code <= 2 ? 'partly cloudy' : code === 3 ? 'cloudy' : code === 45 || code === 48 ? 'foggy' :
      code >= 95 ? 'stormy' : (code >= 71 && code <= 77) ? 'snowy' : 'rainy';
    const SYDNEY = { lat: -33.87, lon: 151.21, city: 'Sydney' };
    const show = (w) => {
      el.innerHTML = `<span class="wx-icon" aria-hidden="true">${icon(w.code, w.day)}</span><b>${Math.round(w.temp)}°</b>`;
      el.title = `${w.city}: ${Math.round(w.temp)}°C, ${label(w.code)}`;
      el.setAttribute('aria-label', el.title);
      el.hidden = false;
    };
    try { const c = JSON.parse(sessionStorage.getItem('wx2') || 'null'); if (c && Date.now() - c.t < 15 * 60e3) return show(c); } catch (_) {}
    // rough location from the visitor's IP (GeoJS, no key); Sydney if that fails
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then((r) => r.json())
      .then((g) => {
        const lat = parseFloat(g.latitude), lon = parseFloat(g.longitude);
        return isFinite(lat) && isFinite(lon) ? { lat, lon, city: g.city || g.region || g.country || 'Here' } : SYDNEY;
      })
      .catch(() => SYDNEY)
      .then((loc) =>
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`)
          .then((r) => r.json())
          .then((d) => {
            const w = { city: loc.city, temp: d.current.temperature_2m, code: d.current.weather_code, day: d.current.is_day === 1, t: Date.now() };
            show(w);
            try { sessionStorage.setItem('wx2', JSON.stringify(w)); } catch (_) {}
          }))
      .catch(() => {}); // no weather, no fuss
  })();
})();

