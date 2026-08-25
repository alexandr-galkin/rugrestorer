export class CleaningController {
  constructor(canvas, carpet, tool) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.carpet = carpet;
    this.tool = tool;
    this.active = false;
    this.last = null;
    this.particles = [];
    this.dirtyCanvas = document.createElement('canvas');
    this.dirtyCtx = this.dirtyCanvas.getContext('2d');
    this.progressCanvas = document.createElement('canvas');
    this.progressCanvas.width = 128;
    this.progressCanvas.height = 128;
    this.progressCtx = this.progressCanvas.getContext('2d', {willReadFrequently:true});
    this.dirtReady = this.loadDirt();
    this.audio = null;
    this.resizeHandler = () => this.resize();
    this.resize();
    this.bind();
  }

  async loadDirt() {
    const image = await this.loadImage(this.carpet.dirtMask);
    this.dirtImage = image;
    this.dirtCanvas.width = this.w || 1;
    this.dirtCanvas.height = this.h || 1;
    this.drawDirtImage();
    this.initialDirty = this.measureDirty();
    this.dirty = this.initialDirty;
    this.ready = true;
    this.draw();
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const d = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(r.width * d));
    this.canvas.height = Math.max(1, Math.round(r.height * d));
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.w = r.width;
    this.h = r.height;
    this.dirtyCanvas.width = Math.max(1, Math.round(this.w));
    this.dirtyCanvas.height = Math.max(1, Math.round(this.h));
    if (this.dirtImage) this.drawDirtImage();
    this.draw();
  }

  bind() {
    this.canvas.onpointerdown = e => {
      this.active = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.initAudio();
      this.paint(e);
    };
    this.canvas.onpointermove = e => { if (this.active) this.paint(e); };
    this.canvas.onpointerup = () => { this.active = false; this.last = null; };
    this.canvas.onpointercancel = () => { this.active = false; this.last = null; };
    window.addEventListener('resize', this.resizeHandler);
  }

  initAudio() {
    if (this.audio) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.audio = new AudioCtx();
    if (this.audio.state === 'suspended') this.audio.resume();
  }

  brushSound(intensity = 0.05) {
    if (!this.audio) return;
    const now = this.audio.currentTime;
    const osc = this.audio.createOscillator();
    const gain = this.audio.createGain();
    const filter = this.audio.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 + Math.random() * 35, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.055);
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(intensity, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
    osc.connect(filter).connect(gain).connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  paint(e) {
    if (!this.ready) return;
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const dx = x - this.w / 2;
    const dy = y - this.h / 2;
    const rw = this.w * .39;
    const rh = Math.min(this.h * .34, rw / this.carpet.ratio);
    if (Math.abs(dx) > rw || Math.abs(dy) > rh) return;

    const distance = this.last ? Math.hypot(x - this.last.x, y - this.last.y) : 0;
    const steps = Math.max(1, Math.ceil(distance / Math.max(8, this.tool.radius * .32)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = this.last ? this.last.x + (x - this.last.x) * t : x;
      const py = this.last ? this.last.y + (y - this.last.y) * t : y;
      this.erase(px, py);
      if (Math.random() < .45) this.spawnDust(px, py);
    }
    this.last = {x, y};
    this.brushSound(Math.min(.07, .025 + distance * .001));
    this.dirty = this.measureDirty();
    this.draw();
  }

  erase(x, y) {
    const c = this.dirtyCtx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.arc(x, y, this.tool.radius * .78, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  spawnDust(x, y) {
    for (let i = 0; i < 2; i++) {
      this.particles.push({x, y, vx:(Math.random()-.5)*32, vy:-18-Math.random()*35, life:.35+Math.random()*.25, size:2+Math.random()*3});
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 45 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  measureDirty() {
    if (!this.dirtImage || !this.w || !this.h) return 0;
    const c = this.progressCtx;
    c.clearRect(0, 0, 128, 128);
    c.drawImage(this.dirtyCanvas, 0, 0, 128, 128);
    const data = c.getImageData(0, 0, 128, 128).data;
    let alpha = 0;
    for (let i = 3; i < data.length; i += 4) alpha += data[i];
    return alpha;
  }

  progress() {
    if (!this.initialDirty) return 0;
    return Math.min(100, Math.max(0, Math.round((1 - this.dirty / this.initialDirty) * 100)));
  }

  drawDirtImage() {
    const c = this.dirtyCtx;
    c.clearRect(0, 0, this.w, this.h);
    const rw = this.w * .39;
    const rh = Math.min(this.h * .34, rw / this.carpet.ratio);
    c.save();
    c.translate(this.w / 2, this.h / 2);
    c.beginPath();
    if (this.carpet.shape === 'oval') c.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    else c.roundRect(-rw, -rh, rw * 2, rh * 2, Math.min(28, rw * .08));
    c.clip();
    c.drawImage(this.dirtImage, -rw, -rh, rw * 2, rh * 2);
    c.restore();
  }

  draw() {
    if (!this.w || !this.h) return;
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    const cx = this.w / 2, cy = this.h / 2;
    const rw = this.w * .39;
    const rh = Math.min(this.h * .34, rw / this.carpet.ratio);

    c.save();
    c.translate(cx, cy);
    c.beginPath();
    if (this.carpet.shape === 'oval') c.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    else c.roundRect(-rw, -rh, rw * 2, rh * 2, Math.min(28, rw * .08));
    c.clip();
    if (this.rugImage) c.drawImage(this.rugImage, -rw, -rh, rw * 2, rh * 2);
    c.restore();

    if (this.ready) c.drawImage(this.dirtyCanvas, 0, 0, this.w, this.h);

    const now = performance.now();
    const dt = Math.min(.035, ((this._lastFrame || now) - now) / -1000 || .016);
    this._lastFrame = now;
    this.updateParticles(dt);
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / .6);
      c.fillStyle = '#d4b994';
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    if (this.active && this.last) {
      c.strokeStyle = 'rgba(255,255,255,.85)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(this.last.x, this.last.y, this.tool.radius, 0, Math.PI * 2); c.stroke();
    }
  }
}
