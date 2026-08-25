export class CleaningController {
  constructor(canvas, carpet, tool, onStats = () => {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.carpet = carpet;
    this.tool = tool;
    this.onStats = onStats;
    this.active = false;
    this.last = null;
    this.particles = [];
    this.dirtyCanvas = document.createElement('canvas');
    this.dirtyCtx = this.dirtyCanvas.getContext('2d');
    this.progressCanvas = document.createElement('canvas');
    this.progressCanvas.width = 128;
    this.progressCanvas.height = 128;
    this.progressCtx = this.progressCanvas.getContext('2d', {willReadFrequently:true});
    this.audio = null;
    this.ready = false;
    this.lastFrame = performance.now();
    this.stats = {strokes:0, distance:0, wasted:0, toolUses:{}};
    this.resizeHandler = () => this.resize();
    this.resize();
    this.bind();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    this.loadAssets();
  }

  async loadAssets() {
    const [rug, dirt] = await Promise.all([
      this.loadImage(this.carpet.asset),
      this.loadImage(this.carpet.dirtMask)
    ]);
    this.rugImage = rug;
    this.dirtImage = dirt;
    this.dirtyCanvas.width = Math.max(1, Math.round(this.w));
    this.dirtyCanvas.height = Math.max(1, Math.round(this.h));
    this.drawDirtImage();
    this.initialDirty = this.measureDirty();
    this.dirty = this.initialDirty;
    this.ready = true;
    this.emitStats();
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
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.max(1, Math.round(this.w * d));
    this.canvas.height = Math.max(1, Math.round(this.h * d));
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    if (this.dirtyCanvas.width && this.dirtyCanvas.height && this.ready) {
      const old = document.createElement('canvas');
      old.width = this.dirtyCanvas.width;
      old.height = this.dirtyCanvas.height;
      old.getContext('2d').drawImage(this.dirtyCanvas, 0, 0);
      this.dirtyCanvas.width = Math.max(1, Math.round(this.w));
      this.dirtyCanvas.height = Math.max(1, Math.round(this.h));
      this.dirtyCtx.drawImage(old, 0, 0, old.width, old.height, 0, 0, this.w, this.h);
    } else {
      this.dirtyCanvas.width = Math.max(1, Math.round(this.w));
      this.dirtyCanvas.height = Math.max(1, Math.round(this.h));
    }
    this.draw();
  }

  bind() {
    this.canvas.onpointerdown = e => {
      this.active = true;
      this.canvas.setPointerCapture(e.pointerId);
      this.initAudio();
      this.stats.strokes++;
      this.stats.toolUses[this.tool.id] = (this.stats.toolUses[this.tool.id] || 0) + 1;
      this.paint(e);
    };
    this.canvas.onpointermove = e => { if (this.active) this.paint(e); };
    this.canvas.onpointerup = () => { this.active = false; this.last = null; };
    this.canvas.onpointercancel = () => { this.active = false; this.last = null; };
    window.addEventListener('resize', this.resizeHandler);
  }

  setTool(tool) {
    this.tool = tool;
    this.last = null;
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
    osc.frequency.setValueAtTime(90 + Math.random() * 55, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.055);
    filter.type = 'lowpass';
    filter.frequency.value = 950;
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
    const steps = Math.max(1, Math.ceil(distance / Math.max(6, this.tool.radius * .3)));
    const previous = this.dirty;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = this.last ? this.last.x + (x - this.last.x) * t : x;
      const py = this.last ? this.last.y + (y - this.last.y) * t : y;
      this.erase(px, py);
      if (Math.random() < .5 * this.tool.coverage) this.spawnDust(px, py);
    }
    this.last = {x, y};
    this.stats.distance += distance;
    this.dirty = this.measureDirty();
    const removed = Math.max(0, previous - this.dirty);
    const expected = Math.PI * (this.tool.radius * .78) ** 2 * steps * this.tool.power;
    this.stats.wasted += Math.max(0, expected - removed * 0.55) / Math.max(1, expected);
    this.brushSound(Math.min(.07, .022 + distance * .0009) * this.tool.coverage);
    this.emitStats();
  }

  erase(x, y) {
    const c = this.dirtyCtx;
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.arc(x, y, this.tool.radius * .78 * this.tool.precision, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  spawnDust(x, y) {
    for (let i = 0; i < Math.max(1, Math.round(2 * this.tool.coverage)); i++) {
      this.particles.push({x, y, vx:(Math.random()-.5)*36, vy:-18-Math.random()*38, life:.32+Math.random()*.28, size:1.5+Math.random()*3});
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 48 * dt;
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

  quality() {
    const clean = this.progress();
    if (!this.ready || clean < 100) return Math.round(clean * .7);
    const strokesPenalty = Math.min(18, Math.max(0, this.stats.strokes - 8) * 1.15);
    const distancePenalty = Math.min(14, Math.max(0, this.stats.distance / 1100 - 1) * 5);
    const wastePenalty = Math.min(24, this.stats.wasted / Math.max(1, this.stats.distance) * 1000);
    const toolPenalty = this.tool.id === this.carpet.idealTool ? 0 : 7;
    return Math.max(0, Math.min(100, Math.round(100 - strokesPenalty - distancePenalty - wastePenalty - toolPenalty)));
  }

  grade() {
    const q = this.quality();
    if (q >= 95) return {label:'MASTER RESTORATION',short:'S',stars:5};
    if (q >= 88) return {label:'EXPERT CLEAN',short:'A',stars:4};
    if (q >= 76) return {label:'GREAT JOB',short:'B',stars:3};
    if (q >= 62) return {label:'GOOD CLEAN',short:'C',stars:2};
    return {label:'ROUGH CLEAN',short:'D',stars:1};
  }

  emitStats() {
    this.onStats({progress:this.progress(),quality:this.quality(),grade:this.grade(),tool:this.tool,stats:{...this.stats}});
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

  animate(now) {
    const dt = Math.min(.035, (now - this.lastFrame) / 1000 || .016);
    this.lastFrame = now;
    this.updateParticles(dt);
    this.draw();
    requestAnimationFrame(this.animate);
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
    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / .6);
      c.fillStyle = '#d4b994';
      c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    if (this.active && this.last) {
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.lineWidth = 2;
      c.beginPath(); c.arc(this.last.x, this.last.y, this.tool.radius, 0, Math.PI * 2); c.stroke();
    }
  }
}
