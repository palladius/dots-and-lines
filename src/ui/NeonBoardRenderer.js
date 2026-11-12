/**
 * NeonBoardRenderer.js — High-DPI Neon Dark Mode Canvas Renderer & Particle FX Engine
 *
 * Visual features inspired by Paolo's Dots & Lines + Carlesso Family Deluxe enhancements:
 * - Deep obsidian dark board with subtle dotted grid guides between dots
 * - Breathing neon dots that pulse and respond to pointer hover/drag
 * - Both SWIPE between two adjacent dots AND TAP on the space between two dots
 * - Multi-layer neon line glow in the player's PuffinLogin color + bright white-hot core on the latest move
 * - Rounded neon box fills with elastic pop-in, shockwave ring, 28-particle burst, and Pixar avatar stamp!
 */

function hexToRgba(hex, alpha = 1) {
  const clean = String(hex || '#22d3ee').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class NeonBoardRenderer {
  constructor(canvas, { onSelectSegment } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onSelectSegment = onSelectSegment;
    this.state = null;
    this.players = {
      p1: { name: 'Ale', colorHex: '#EF4444', glowHex: '#FCA5A5', avatar: './assets/avatars/ale.png', emoji: '🐉' },
      p2: { name: 'Seby', colorHex: '#3B82F6', glowHex: '#93C5FD', avatar: './assets/avatars/seby.png', emoji: '🏎️' },
    };

    this.avatarImages = new Map();
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.boxAnimations = new Map(); // key "r,c" -> { startTime }

    this.layout = {
      width: 360,
      height: 420,
      padX: 36,
      padY: 36,
      step: 64,
      originX: 36,
      originY: 36,
    };

    this.pointer = {
      isDown: false,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      anchorDot: null, // { r, c, x, y }
      hoverSegment: null, // { type: 'h'|'v', r, c }
    };

    this._rafId = null;
    this._bindEvents();
    this._observeStageResize();
    this._startLoop();
  }

  _observeStageResize() {
    const stage = this.canvas?.parentElement;
    if (stage && typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this.resize());
      this._resizeObserver.observe(stage);
    }
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }
  }

  setState(state) {
    this.state = state;
    this.boxAnimations.clear();
    this.resize();
  }

  setPlayers(playersMap) {
    if (playersMap?.p1) {
      this.players.p1 = { ...this.players.p1, ...playersMap.p1 };
      this._preloadAvatar(this.players.p1.avatar);
    }
    if (playersMap?.p2) {
      this.players.p2 = { ...this.players.p2, ...playersMap.p2 };
      this._preloadAvatar(this.players.p2.avatar);
    }
  }

  _preloadAvatar(src) {
    if (!src || this.avatarImages.has(src) || typeof Image === 'undefined') return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    this.avatarImages.set(src, img);
  }

  resize() {
    if (!this.canvas) return;
    const stage = this.canvas.parentElement;
    const rect = stage?.getBoundingClientRect() || { width: 360, height: 420 };
    const rawW = stage?.clientWidth || rect.width || 360;
    const rawH = stage?.clientHeight || rect.height || 420;
    const cssW = Math.max(160, Math.floor(rawW));
    const cssH = Math.max(160, Math.floor(rawH));
    const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2.5);

    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = this.state?.boxCols || 4;
    const rows = this.state?.boxRows || 5;
    const pad = Math.max(20, Math.min(36, Math.round(Math.min(cssW, cssH) * 0.075)));
    const usableW = Math.max(80, cssW - pad * 2);
    const usableH = Math.max(80, cssH - pad * 2);
    const step = Math.max(20, Math.floor(Math.min(usableW / cols, usableH / rows)));
    const gridW = step * cols;
    const gridH = step * rows;

    this.layout = {
      width: cssW,
      height: cssH,
      padX: pad,
      padY: pad,
      step,
      originX: Math.round((cssW - gridW) / 2),
      originY: Math.round((cssH - gridH) / 2),
      gridW,
      gridH,
    };
  }

  getDotCoords(r, c) {
    return {
      x: this.layout.originX + c * this.layout.step,
      y: this.layout.originY + r * this.layout.step,
    };
  }

  triggerMoveEffects(moveResult) {
    if (!moveResult?.ok) return;
    const playerInfo = this.players[moveResult.player] || this.players.p1;
    const color = playerInfo.colorHex || '#22d3ee';
    const now = performance.now();

    if (Array.isArray(moveResult.capturedBoxes) && moveResult.capturedBoxes.length > 0) {
      for (const box of moveResult.capturedBoxes) {
        const key = `${box.r},${box.c}`;
        this.boxAnimations.set(key, { startTime: now });

        const topLeft = this.getDotCoords(box.r, box.c);
        const cx = topLeft.x + this.layout.step / 2;
        const cy = topLeft.y + this.layout.step / 2;

        // Add expanding shockwave ring
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: this.layout.step * 0.18,
          maxRadius: this.layout.step * 0.95,
          color,
          alpha: 0.95,
        });

        // Add 28 neon sparks
        for (let i = 0; i < 28; i++) {
          const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.25;
          const speed = 1.6 + Math.random() * 4.2;
          this.particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.2 + Math.random() * 3.0,
            color: i % 4 === 0 ? '#ffffff' : color,
            alpha: 1,
            decay: 0.022 + Math.random() * 0.018,
          });
        }
      }

      // Floating combo banner
      const firstBox = moveResult.capturedBoxes[0];
      const topLeft = this.getDotCoords(firstBox.r, firstBox.c);
      const cx = topLeft.x + this.layout.step / 2;
      const cy = topLeft.y + this.layout.step / 3;
      const combo = moveResult.comboCount || 1;
      const label =
        moveResult.capturedBoxes.length > 1
          ? `DOPPIO BOX! 🔥 x${combo}`
          : combo >= 2
          ? `COMBO x${combo}! ⚡`
          : `+1 ${playerInfo.emoji || '✨'}`;

      this.floatingTexts.push({
        x: cx,
        y: cy,
        text: label,
        color,
        alpha: 1,
        vy: -1.15,
        scale: combo >= 2 ? 1.18 : 1.0,
      });
    }
  }

  _bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX : e.clientX;
      const clientY = e.touches ? e.touches[0]?.clientY ?? e.changedTouches?.[0]?.clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const onDown = (e) => {
      if (!this.state || this.state.isGameOver) return;
      if (e.cancelable) e.preventDefault();
      const pt = getPos(e);
      this.pointer.isDown = true;
      this.pointer.startX = pt.x;
      this.pointer.startY = pt.y;
      this.pointer.currX = pt.x;
      this.pointer.currY = pt.y;
      this.pointer.anchorDot = this._findNearestDot(pt.x, pt.y, this.layout.step * 0.42);
      this.pointer.hoverSegment = this._resolveSegmentFromInteraction(pt.x, pt.y);
    };

    const onMove = (e) => {
      if (!this.state || this.state.isGameOver) return;
      const pt = getPos(e);
      this.pointer.currX = pt.x;
      this.pointer.currY = pt.y;
      if (this.pointer.isDown && e.cancelable) e.preventDefault();
      this.pointer.hoverSegment = this._resolveSegmentFromInteraction(pt.x, pt.y);
    };

    const onUp = (e) => {
      if (!this.pointer.isDown) return;
      if (e.cancelable) e.preventDefault();
      const pt = getPos(e);
      this.pointer.currX = pt.x;
      this.pointer.currY = pt.y;
      const seg = this._resolveSegmentFromInteraction(pt.x, pt.y) || this.pointer.hoverSegment;
      this.pointer.isDown = false;
      this.pointer.anchorDot = null;
      this.pointer.hoverSegment = null;

      if (seg && typeof this.onSelectSegment === 'function') {
        this.onSelectSegment(seg.type, seg.r, seg.c);
      }
    };

    this.canvas.addEventListener?.('pointerdown', onDown);
    this.canvas.addEventListener?.('pointermove', onMove);
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('pointerup', onUp);
    }
  }

  _findNearestDot(x, y, maxDist) {
    if (!this.state) return null;
    let best = null;
    let bestDist = maxDist;
    for (let r = 0; r < this.state.dotRows; r++) {
      for (let c = 0; c < this.state.dotCols; c++) {
        const d = this.getDotCoords(r, c);
        const dist = Math.hypot(x - d.x, y - d.y);
        if (dist <= bestDist) {
          bestDist = dist;
          best = { r, c, x: d.x, y: d.y };
        }
      }
    }
    return best;
  }

  _resolveSegmentFromInteraction(x, y) {
    if (!this.state || this.state.isGameOver) return null;
    const step = this.layout.step;

    // 1. If dragging from an anchor dot, resolve swipe direction toward adjacent dot
    if (this.pointer.isDown && this.pointer.anchorDot) {
      const anchor = this.pointer.anchorDot;
      const dx = x - anchor.x;
      const dy = y - anchor.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= step * 0.24) {
        if (Math.abs(dx) > Math.abs(dy)) {
          const c = dx > 0 ? anchor.c : anchor.c - 1;
          const r = anchor.r;
          if (r >= 0 && r < this.state.dotRows && c >= 0 && c < this.state.boxCols && !this.state.H[r][c]) {
            return { type: 'h', r, c };
          }
        } else {
          const r = dy > 0 ? anchor.r : anchor.r - 1;
          const c = anchor.c;
          if (r >= 0 && r < this.state.boxRows && c >= 0 && c < this.state.dotCols && !this.state.V[r][c]) {
            return { type: 'v', r, c };
          }
        }
      }
    }

    // 2. Direct tap / hover on the segment midpoint between two dots
    let bestSeg = null;
    let bestDist = step * 0.42;

    const pointToSegDist = (px, py, x1, y1, x2, y2) => {
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return Math.hypot(px - x1, py - y1);
      const t = Math.max(0.15, Math.min(0.85, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      return Math.hypot(px - projX, py - projY);
    };

    for (let r = 0; r < this.state.dotRows; r++) {
      for (let c = 0; c < this.state.boxCols; c++) {
        if (this.state.H[r][c]) continue;
        const p1 = this.getDotCoords(r, c);
        const p2 = this.getDotCoords(r, c + 1);
        const d = pointToSegDist(x, y, p1.x, p1.y, p2.x, p2.y);
        if (d < bestDist) {
          bestDist = d;
          bestSeg = { type: 'h', r, c };
        }
      }
    }

    for (let r = 0; r < this.state.boxRows; r++) {
      for (let c = 0; c < this.state.dotCols; c++) {
        if (this.state.V[r][c]) continue;
        const p1 = this.getDotCoords(r, c);
        const p2 = this.getDotCoords(r + 1, c);
        const d = pointToSegDist(x, y, p1.x, p1.y, p2.x, p2.y);
        if (d < bestDist) {
          bestDist = d;
          bestSeg = { type: 'v', r, c };
        }
      }
    }

    return bestSeg;
  }

  _startLoop() {
    if (typeof requestAnimationFrame === 'undefined') return;
    const tick = (now) => {
      this.render(now);
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  render(now = performance.now()) {
    const ctx = this.ctx;
    const { width, height, step } = this.layout;
    ctx.clearRect(0, 0, width, height);

    if (!this.state) return;

    // 1. Subtle dotted grid guides (Paolo's dark board style)
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.13)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 6]);
    for (let r = 0; r < this.state.dotRows; r++) {
      const start = this.getDotCoords(r, 0);
      const end = this.getDotCoords(r, this.state.boxCols);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    for (let c = 0; c < this.state.dotCols; c++) {
      const start = this.getDotCoords(0, c);
      const end = this.getDotCoords(this.state.boxRows, c);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Claimed Boxes (Rounded neon squares + squash & stretch + Pixar avatar stamp)
    const boxInset = Math.max(6, Math.round(step * 0.11));
    const boxSize = step - boxInset * 2;
    const boxRadius = Math.max(8, Math.round(step * 0.18));

    for (let r = 0; r < this.state.boxRows; r++) {
      for (let c = 0; c < this.state.boxCols; c++) {
        const box = this.state.boxes[r][c];
        if (!box) continue;
        const pInfo = this.players[box.owner] || this.players.p1;
        const color = pInfo.colorHex || '#22d3ee';
        const topLeft = this.getDotCoords(r, c);
        const cx = topLeft.x + step / 2;
        const cy = topLeft.y + step / 2;

        // Elastic squash & stretch animation on newly closed box
        let scale = 1;
        const anim = this.boxAnimations.get(`${r},${c}`);
        if (anim) {
          const elapsed = (now - anim.startTime) / 380;
          if (elapsed < 1) {
            scale = 1 + Math.sin(elapsed * Math.PI) * 0.18;
          } else {
            this.boxAnimations.delete(`${r},${c}`);
          }
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // Rounded neon box fill
        ctx.fillStyle = hexToRgba(color, 0.28);
        ctx.strokeStyle = hexToRgba(color, 0.55);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        this._roundRectPath(ctx, -boxSize / 2, -boxSize / 2, boxSize, boxSize, boxRadius);
        ctx.fill();
        ctx.stroke();

        // Player Pixar avatar medallion or initial stamp inside conquered box.
        // Unlogged players (isLogged === false) => plain neon color only, NO face/stamp.
        const showStamp = pInfo.isLogged !== false;
        const avatarImg = pInfo.avatar ? this.avatarImages.get(pInfo.avatar) : null;
        const stampRadius = Math.max(10, Math.min(22, boxSize * 0.34));
        if (!showStamp) {
          // color-only box, nothing to draw
        } else if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.globalAlpha = 0.88;
          const cropSize = Math.min(avatarImg.naturalWidth, avatarImg.naturalHeight) * 0.72;
          const sx = (avatarImg.naturalWidth - cropSize) / 2;
          const sy = avatarImg.naturalHeight * 0.08;
          ctx.drawImage(
            avatarImg,
            sx,
            sy,
            cropSize,
            cropSize,
            -stampRadius,
            -stampRadius,
            stampRadius * 2,
            stampRadius * 2
          );
          ctx.restore();

          ctx.beginPath();
          ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
          ctx.strokeStyle = hexToRgba(color, 0.85);
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else {
          ctx.fillStyle = hexToRgba(color, 0.92);
          ctx.font = `800 ${Math.round(stampRadius * 1.1)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pInfo.emoji || pInfo.name?.[0] || '★', 0, 1);
        }

        ctx.restore();
      }
    }

    // 3. Hover / Swipe Preview Segment
    if (this.pointer.hoverSegment && !this.state.isGameOver) {
      const seg = this.pointer.hoverSegment;
      const activeP = this.players[this.state.currentTurn] || this.players.p1;
      const coords = this._getSegmentEndpoints(seg.type, seg.r, seg.c);
      ctx.save();
      ctx.strokeStyle = hexToRgba(activeP.colorHex, 0.55);
      ctx.shadowColor = activeP.colorHex;
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.max(5, step * 0.1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(coords.x1, coords.y1);
      ctx.lineTo(coords.x2, coords.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Claimed Horizontal & Vertical Neon Segments
    const drawClaimedSegment = (type, r, c, cell) => {
      if (!cell) return;
      const pInfo = this.players[cell.owner] || this.players.p1;
      const color = pInfo.colorHex || '#22d3ee';
      const isLast =
        this.state.lastMove &&
        this.state.lastMove.type === type &&
        this.state.lastMove.r === r &&
        this.state.lastMove.c === c;
      const { x1, y1, x2, y2 } = this._getSegmentEndpoints(type, r, c);

      ctx.save();
      ctx.lineCap = 'round';

      // Outer neon halo
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = isLast ? 22 : 14;
      ctx.lineWidth = Math.max(6, step * 0.115);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Paolo's signature white-hot inner laser core on the latest move!
      if (isLast) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.6, step * 0.048);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    };

    for (let r = 0; r < this.state.dotRows; r++) {
      for (let c = 0; c < this.state.boxCols; c++) {
        drawClaimedSegment('h', r, c, this.state.H[r][c]);
      }
    }
    for (let r = 0; r < this.state.boxRows; r++) {
      for (let c = 0; c < this.state.dotCols; c++) {
        drawClaimedSegment('v', r, c, this.state.V[r][c]);
      }
    }

    // 5. Breathing Neon Dots
    const pulse = Math.sin(now * 0.004) * 0.65;
    const baseDotRadius = Math.max(4.5, Math.min(6.5, step * 0.085));
    const activeColor = (this.players[this.state.currentTurn] || this.players.p1).colorHex;

    for (let r = 0; r < this.state.dotRows; r++) {
      for (let c = 0; c < this.state.dotCols; c++) {
        const d = this.getDotCoords(r, c);
        const isAnchor =
          this.pointer.anchorDot &&
          this.pointer.anchorDot.r === r &&
          this.pointer.anchorDot.c === c;
        const rad = isAnchor ? baseDotRadius * 1.45 : baseDotRadius + pulse * 0.35;

        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = isAnchor ? activeColor : '#e2e8f0';
        ctx.shadowColor = isAnchor ? activeColor : 'rgba(226, 232, 240, 0.6)';
        ctx.shadowBlur = isAnchor ? 16 : 6;
        ctx.fill();
        ctx.restore();
      }
    }

    // 6. Shockwaves, Particles & Floating Combo Text
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.16;
      sw.alpha -= 0.045;
      if (sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(sw.color, sw.alpha);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.alpha -= pt.decay;
      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.022;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `900 ${Math.round(15 * ft.scale)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  _getSegmentEndpoints(type, r, c) {
    if (type === 'h') {
      const p1 = this.getDotCoords(r, c);
      const p2 = this.getDotCoords(r, c + 1);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }
    const p1 = this.getDotCoords(r, c);
    const p2 = this.getDotCoords(r + 1, c);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }

  _roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
}
