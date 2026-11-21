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
  const svg = (name, cls = 'pix') =>
    `<svg class="${cls}" viewBox="0 0 12 12" aria-hidden="true">${sprite(name)}</svg>`;

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
    bar.querySelector('.maxbtn').addEventListener('click', () => win.classList.toggle('max'));
    bar.addEventListener('dblclick', (e) => { if (!e.target.closest('.wbtn')) win.classList.toggle('max'); });
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
  function openWin(id) {
    const win = document.getElementById(id);
    if (!win.classList.contains('open')) {
      win.classList.add('open');
      if (!win.dataset.placed && !isMobile()) {
        // gentle cascade so new windows don't stack exactly
        cascade = (cascade + 1) % 5;
        win.style.left = Math.min(parseInt(win.dataset.x, 10) + cascade * 24, Math.max(8, window.innerWidth - win.offsetWidth - 8)) + 'px';
        win.style.top = (parseInt(win.dataset.y, 10) + cascade * 24) + 'px';
        win.dataset.placed = '1';
      }
    }
    $('#task-' + id).hidden = false;
    focusWin(id);
  }
  function closeWin(id) {
    const win = document.getElementById(id);
    win.classList.remove('open', 'focus', 'max');
    $('#task-' + id).hidden = true;
  }
  function minimise(id) {
    const win = document.getElementById(id);
    win.classList.remove('open', 'focus');
    $('#task-' + id).classList.remove('focus');
  }

  /* ---------- dragging (mouse + touch via pointer events) ---------- */
  function enableDrag(win, bar) {
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.wbtn') || isMobile() || win.classList.contains('max')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = win.offsetLeft; oy = win.offsetTop;
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxX = desktop.clientWidth - 60;
      const maxY = desktop.clientHeight - 40;
      win.style.left = Math.max(-win.offsetWidth + 80, Math.min(maxX, ox + e.clientX - sx)) + 'px';
      win.style.top = Math.max(0, Math.min(maxY, oy + e.clientY - sy)) + 'px';
    });
    const stop = () => { dragging = false; };
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
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
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
})();
