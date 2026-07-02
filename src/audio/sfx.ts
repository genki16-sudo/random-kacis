// Kendi ürettiğimiz kısa ses efektleri (telifsiz, Web Audio API).

function withContext(run: (ctx: AudioContext, master: GainNode) => number): void {
  const Ctor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();
  void ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.3;
  master.connect(ctx.destination);
  const lifetime = run(ctx, master);
  setTimeout(() => { void ctx.close(); }, lifetime * 1000 + 200);
}

/** Kapı gıcırtısı: yavaşça yükselen, titreşimli, kamışlı bir ses. */
export function playDoorCreak(): void {
  withContext((ctx, master) => {
    const dur = 0.9;
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t0);
    osc.frequency.linearRampToValueAtTime(150, t0 + dur * 0.8);
    osc.frequency.linearRampToValueAtTime(90, t0 + dur);

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 380;
    band.Q.value = 6;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    // "gıcırt" dokusu için hafif tremolo
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);

    osc.connect(band);
    band.connect(g);
    g.connect(master);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + dur);
    lfo.stop(t0 + dur);

    // kapanış "tok" sesi
    const thud = ctx.createOscillator();
    const tg = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, t0 + dur);
    thud.frequency.exponentialRampToValueAtTime(50, t0 + dur + 0.12);
    tg.gain.setValueAtTime(0.6, t0 + dur);
    tg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.16);
    thud.connect(tg);
    tg.connect(master);
    thud.start(t0 + dur);
    thud.stop(t0 + dur + 0.2);

    return dur + 0.3;
  });
}

/** Cop darbesi: kısa, sert "tok" sesi. */
export function playWhack(): void {
  withContext((ctx, master) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t0);
    osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.12);
    g.gain.setValueAtTime(0.7, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.18);
    return 0.25;
  });
}

/** Alkış: gürültü tabanlı, üst üste binen kısa "şap"lar. */
export function playApplause(): void {
  withContext((ctx, master) => {
    const dur = 1.6;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const t0 = ctx.currentTime;
    for (let i = 0; i < 22; i++) {
      const t = t0 + Math.random() * dur;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1400 + Math.random() * 1600;
      bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(t, Math.random() * dur * 0.4, 0.12);
    }
    return dur + 0.3;
  });
}

/** Isırma sesi: iki kısa "çıt" ile ısırış. */
export function playChomp(): void {
  withContext((ctx, master) => {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = t0 + i * 0.09;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + 0.08);
    }
    return 0.3;
  });
}
