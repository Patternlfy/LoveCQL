/**
 * particles.js
 * 包含两个粒子系统：
 *  1. StarField   — 星空背景（index / choice 页面）
 *  2. HeartParticles — 爱心粒子带拖尾（ending 页面）
 */

/* ================================================
   StarField — 闪烁星空 + 渐变背景
   ================================================ */
class StarField {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.stars   = [];
    this._raf    = null;
    this._resize = this._resize.bind(this);
    this._resize();
    this._initStars();
    window.addEventListener('resize', this._resize, { passive: true });
  }

  /* 画布大小同步视口 */
  _resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
    this._initStars(); // 重绘时重新分布星星
  }

  /* 生成星星数据 */
  _initStars() {
    const density = Math.floor((this.W * this.H) / 5500);
    this.stars = Array.from({ length: density }, () => ({
      x:     Math.random() * this.W,
      y:     Math.random() * this.H,
      r:     Math.random() * 1.4 + 0.25,
      phase: Math.random() * Math.PI * 2,  // 随机初始相位，避免同步闪烁
      speed: Math.random() * 0.009 + 0.003,
    }));
  }

  /* 渲染单帧 */
  _draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    /* 背景渐变 */
    const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
    bg.addColorStop(0,   '#07000f');
    bg.addColorStop(0.5, '#120025');
    bg.addColorStop(1,   '#07000f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 绘制星星 */
    this.stars.forEach(s => {
      s.phase += s.speed;
      // alpha 在 0.15 ~ 1.0 之间正弦波动
      const alpha = (Math.sin(s.phase) + 1) / 2 * 0.85 + 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,245,249,${alpha})`;
      ctx.fill();
    });
  }

  /* 启动动画循环 */
  start() {
    const loop = () => {
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    loop();
    return this;
  }

  /* 停止动画 */
  stop() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._resize);
  }
}

/* ================================================
   HeartParticles — 爱心粒子 + 拖尾
   ================================================ */
class HeartParticles {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.particles = [];
    this._running = false;
    this._raf     = null;
    this._resize  = this._resize.bind(this);
    this._resize();
    window.addEventListener('resize', this._resize, { passive: true });
  }

  _resize() {
    this.W = this.canvas.width  = window.innerWidth;
    this.H = this.canvas.height = window.innerHeight;
  }

  /* 创建一个爱心粒子 */
  _create() {
    const colors = [
      '#ff6b9d','#ff3366','#ff8e53',
      '#ffd700','#ff69b4','#ffb3c6',
    ];
    return {
      x:        Math.random() * this.W,
      y:        this.H + 20,
      vx:       (Math.random() - 0.5) * 1.8,
      vy:       -(Math.random() * 2.2 + 1.0),
      size:     Math.random() * 14 + 5,
      color:    colors[Math.floor(Math.random() * colors.length)],
      alpha:    1,
      trail:    [],                               // 拖尾历史坐标
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
    };
  }

  /* 绘制爱心形状（贝塞尔曲线） */
  _drawHeart(ctx, x, y, size, rotation, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = size * 0.9;

    ctx.beginPath();
    /* 以 size 为基准单位绘制对称爱心 */
    const s = size;
    ctx.moveTo(0, -s * 0.28);
    ctx.bezierCurveTo( s * 0.52, -s * 0.72,  s * 0.92, -s * 0.18,  0,  s * 0.52);
    ctx.bezierCurveTo(-s * 0.92, -s * 0.18, -s * 0.52, -s * 0.72,  0, -s * 0.28);
    ctx.fill();
    ctx.restore();
  }

  /* 更新粒子状态 */
  _update() {
    /* 按密度补充粒子 */
    const maxCount = Math.min(50, Math.floor(this.W / 10));
    while (this.particles.length < maxCount) {
      this.particles.push(this._create());
    }

    /* 过滤消亡粒子 */
    this.particles = this.particles.filter(p => p.alpha > 0.015);

    this.particles.forEach(p => {
      /* 记录拖尾（最多 10 帧）*/
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
      if (p.trail.length > 10) p.trail.shift();

      /* 运动 */
      p.x      += p.vx;
      p.y      += p.vy;
      p.vy     -= 0.012;                     // 加速上浮
      p.vx     += (Math.random() - 0.5) * 0.1; // 轻微左右漂移
      p.alpha  -= 0.005;
      p.rotation += p.rotSpeed;
    });
  }

  /* 渲染单帧 */
  _draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    /* 背景 */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#07000f');
    bg.addColorStop(1, '#1a0030');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 拖尾 + 主体 */
    this.particles.forEach(p => {
      /* 绘制拖尾（由旧到新，由小到大，透明度递减）*/
      p.trail.forEach((t, i) => {
        const ratio       = i / p.trail.length;
        const trailAlpha  = ratio * t.alpha * 0.3;
        const trailSize   = p.size * ratio * 0.65;
        if (trailAlpha > 0.01) {
          this._drawHeart(ctx, t.x, t.y, trailSize, p.rotation, p.color, trailAlpha);
        }
      });
      /* 绘制主体 */
      this._drawHeart(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
    });
  }

  /* 启动 */
  start() {
    this._running = true;
    const loop = () => {
      if (!this._running) return;
      this._update();
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    loop();
    return this;
  }

  /* 停止 */
  stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._resize);
  }
}

/* 挂载到全局 */
window.StarField      = StarField;
window.HeartParticles = HeartParticles;
