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
                heart: 'envelope', mic: 'mic', floppy: 'typewriter' };
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

  /* ---------- pigeon pet (bops when hovered) ---------- */
  (() => {
    let rects = '';
    PIGEON.forEach((row, y) => [...row].forEach((c, x) => {
      if (c !== '.') rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PIGEON_COLORS[c]}"/>`;
    }));
    const b = document.createElement('button');
    b.className = 'pigeon';
    b.setAttribute('aria-label', 'A pigeon. Hover to make it bop.');
    b.innerHTML = `<svg viewBox="0 0 16 14" aria-hidden="true">${rects}</svg>`;
    document.body.appendChild(b);
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

  function openWin(id) {
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
  }
  function closeWin(id) {
    const win = document.getElementById(id);
    stopAnim(win);
    win.classList.remove('focus');
    $('#task-' + id).hidden = true;
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
      const focused = wins.find((w) => w.classList.contains('focus') && w.classList.contains('open'));
      if (focused) closeWin(focused.id);
    }
  });

  /* ---------- clock ---------- */
  const clock = $('#clock');
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  tick(); setInterval(tick, 15000);

  /* ---------- sparkle cursor trail (skipped for reduced motion / touch) ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (false && !reduce && window.matchMedia('(pointer: fine)').matches) {
    const glyphs = ['✿', '★', '♥', '✦'];
    const hues = ['#ff7ab8', '#b5a0ff', '#6ec6ff', '#ffd84d', '#6fe3a8'];
    let last = 0;
    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      s.style.left = e.clientX + 6 + 'px';
      s.style.top = e.clientY + 6 + 'px';
      s.style.color = hues[Math.floor(Math.random() * hues.length)];
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 800);
    });
  }

  /* ---------- open the windows marked data-open ---------- */
  if (!isMobile()) wins.forEach((w) => { if (w.dataset.open === 'true') openWin(w.id); });

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
    const close = () => { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 180); };
    const open = (src, alt, text) => {
      img.src = src; img.alt = alt || ''; cap.textContent = text || '';
      box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
    };
    const tiles = '.shot, .canvas .ph';
    document.querySelectorAll(tiles).forEach(t => { t.tabIndex = 0; t.setAttribute('role', 'button'); });
    const fire = t => {
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
    box.innerHTML = '<article class="zoom-card talk-card" role="dialog" aria-modal="true"><button class="zoom-x" aria-label="Close">×</button><div class="talk-body"></div></article>';
    document.body.appendChild(box);
    const body = box.querySelector('.talk-body');
    let last = null;
    const close = () => { box.classList.remove('on'); setTimeout(() => { box.hidden = true; }, 180); if (last) last.focus(); };
    const open = (t) => {
      last = t;
      body.innerHTML = '<p class="kicker">talk</p>' + t.querySelector('h3').outerHTML +
        t.querySelector('.abstract').innerHTML +
        '<p class="kicker">presented at</p>' + t.querySelector('.where-list').outerHTML;
      box.hidden = false; requestAnimationFrame(() => box.classList.add('on'));
      box.querySelector('.zoom-x').focus();
    };
    document.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const t = e.target.closest('.talk'); if (t) open(t);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !box.hidden) close();
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.talk')) { e.preventDefault(); open(e.target); }
    });
    box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.zoom-x')) close(); });
  })();
})();
