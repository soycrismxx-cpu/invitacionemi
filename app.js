(() => {
  'use strict';
  const config = window.INVITATION_CONFIG || {};
  const eventTime = new Date(config.eventDate || '2026-10-30T16:00:00-06:00').getTime();
  function tick() {
    const remaining = Math.max(0, Math.floor((eventTime - Date.now()) / 1000));
    const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => { document.getElementById(id).textContent = String(values[i]).padStart(2, '0'); });
    if (!remaining) document.getElementById('count-title').textContent = '¡LLEGÓ EL DÍA DE LA MAGIA!';
  }
  tick(); setInterval(tick, 1000);
  const form = document.getElementById('rsvp-form');
  const status = document.getElementById('status');
  const button = document.getElementById('submit');
  let pending = null;
  function notify(message, kind = '') { status.textContent = message; status.dataset.kind = kind; }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.rsvpEndpoint || '')) {
      notify('Las confirmaciones todavía no están habilitadas. Por favor, avisa a quien organiza la fiesta.', 'error'); return;
    }
    const data = { name: form.elements.name.value.trim(), attendance: form.elements.attendance.value, website: form.elements.website.value };
    if (!data.name) { notify('Escribe tu nombre para continuar.', 'error'); form.elements.name.focus(); return; }
    const fingerprint = JSON.stringify(data);
    if (!pending || pending.fingerprint !== fingerprint) pending = { fingerprint, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    data.requestId = pending.id;
    button.disabled = true; form.setAttribute('aria-busy', 'true'); notify('Enviando tu respuesta…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      // URLSearchParams evita un preflight CORS. Nunca usamos no-cors: necesitamos leer la confirmación real.
      const response = await fetch(config.rsvpEndpoint, { method: 'POST', body: new URLSearchParams(data), signal: controller.signal, redirect: 'follow', credentials: 'omit' });
      if (!response.ok) throw new Error('http');
      const result = await response.json();
      if (!result.ok) { notify(result.error || 'No se pudo guardar la respuesta. Intenta de nuevo.', 'error'); return; }
      notify(data.attendance === 'si' ? '¡Respuesta guardada! Nos vemos para celebrar a Emily.' : 'Tu respuesta quedó guardada. Gracias por avisarnos.');
      // Conservamos el ID hasta que cambien los datos para evitar duplicados en reintentos.
    } catch (error) {
      notify('No pudimos verificar que tu respuesta se guardara. Revisa tu conexión y vuelve a intentar con los mismos datos; el reintento no duplica el registro.', 'error');
    } finally { clearTimeout(timeout); button.disabled = false; form.removeAttribute('aria-busy'); }
  });
})();

// Una entrada progresiva: sin JavaScript el contenido sigue disponible.
(() => {
  const cover = document.getElementById('opening');
  const invitation = document.getElementById('invitation');
  const open = document.getElementById('open-invitation');
  const music = document.getElementById('music');
  const musicToggle = document.getElementById('music-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  music.volume = 0.35;
  musicToggle.addEventListener('click', () => {
    if (music.paused) music.play().catch(() => {});
    else music.pause();
  });
  music.addEventListener('play', () => { musicToggle.hidden = false; musicToggle.classList.remove('is-paused'); musicToggle.setAttribute('aria-label', 'Pausar música'); });
  music.addEventListener('pause', () => { musicToggle.classList.add('is-paused'); musicToggle.setAttribute('aria-label', 'Reproducir música'); });
  music.addEventListener('error', () => { musicToggle.hidden = true; });
  cover.hidden = false;
  invitation.hidden = true;
  document.body.classList.add('is-sealed');
  window.scrollTo(0, 0);
  const dust = document.querySelector('.magic-dust');
  open.addEventListener('click', () => {
    open.disabled = true;
    music.play().catch(() => { musicToggle.hidden = false; musicToggle.classList.add('is-paused'); });
    cover.classList.add('opening-now');
    setTimeout(() => {
      cover.hidden = true;
      invitation.hidden = false;
      document.body.classList.remove('is-sealed');
      invitation.classList.add('unwrapped');
      window.scrollTo(0, 0);
      document.querySelector('h1').focus({ preventScroll: true });
      if ('IntersectionObserver' in window && !reduced.matches) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
        }), { threshold: 0.12 });
        document.querySelectorAll('.reveal').forEach(section => { section.classList.add('will-reveal'); observer.observe(section); });
      }
    }, reduced.matches ? 0 : 1100);
  });
})();

// Destellos breves en los controles; se respeta la preferencia de movimiento reducido.
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.button, .charm-link, .discover').forEach(control => {
    control.addEventListener('pointerdown', event => {
      if (motion.matches) return;
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement('span');
        spark.className = 'spell-spark'; spark.textContent = '';
        spark.setAttribute('aria-hidden', 'true');
        const angle = i * Math.PI / 4;
        spark.style.cssText = 'left:' + event.clientX + 'px;top:' + event.clientY + 'px;--dx:' + Math.cos(angle) * 65 + 'px;--dy:' + Math.sin(angle) * 65 + 'px';
        document.body.appendChild(spark); setTimeout(() => spark.remove(), 850);
      }
    });
  });
})();

(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'spotlight-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { ...pos };
  let visible = false;
  let frame = 0;
  let hideTimer = 0;
  let scale = 1;
  function resize() {
    scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = innerWidth * scale;
    canvas.height = innerHeight * scale;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    draw();
  }
  addEventListener('resize', resize);
  function moveLight(event) {
    target.x = event.clientX;
    target.y = event.clientY;
    visible = true;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { visible = false; draw(); }, event.pointerType === 'touch' ? 180 : 900);
    requestDraw();
  }
  addEventListener('pointermove', moveLight);
  addEventListener('pointerdown', moveLight);
  addEventListener('pointerup', () => {
    if (!matchMedia('(hover: hover)').matches) {
      visible = false;
      draw();
    }
  });
  addEventListener('pointerleave', () => { visible = false; draw(); });
  resize();
  function requestDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function draw() {
    frame = 0;
    pos.x += (target.x - pos.x) * 0.32;
    pos.y += (target.y - pos.y) * 0.32;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (visible) {
      ctx.fillStyle = 'rgba(8, 4, 14, .22)';
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      const radius = 135;
      const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
      glow.addColorStop(0, 'rgba(255, 248, 231, .78)');
      glow.addColorStop(.58, 'rgba(255, 248, 231, .44)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (visible && (Math.abs(target.x - pos.x) > .5 || Math.abs(target.y - pos.y) > .5)) requestDraw();
  }
})();
