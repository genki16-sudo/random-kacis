// Kendi ürettiğimiz halay müziği (telifsiz, Web Audio API).
// Zurna benzeri parlak bir ezgi + davul ritmi, döngüsel.

export interface HalayMusic {
  suspend(): void;
  resume(): void;
  stop(): void;
}

export function startHalayMusic(): HalayMusic {
  const Ctor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();
  void ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  // "Zurna" hattı: sawtooth + bandpass (parlak, kamışlı ton)
  const leadFilter = ctx.createBiquadFilter();
  leadFilter.type = 'bandpass';
  leadFilter.frequency.value = 1400;
  leadFilter.Q.value = 2.5;
  leadFilter.connect(master);

  // Hicaz esintili, hareketli bir ezgi (Hz). null = es.
  const A3 = 220, B3 = 246.94, C4 = 277.18, D4 = 293.66, E4 = 329.63,
    F4 = 349.23, G4 = 392.0, A4 = 440.0, Bb4 = 466.16;
  const melody: (number | null)[] = [
    A4, G4, F4, E4, F4, G4, A4, null,
    Bb4, A4, G4, F4, E4, D4, E4, null,
    A4, A4, G4, F4, G4, A4, Bb4, A4,
    G4, F4, E4, D4, C4, D4, E4, null,
    A3, B3, C4, D4, E4, F4, E4, D4,
    C4, D4, E4, F4, G4, A4, G4, null,
  ];

  const bpm = 132;
  const stepDur = 60 / bpm / 2; // sekizlik nota
  let step = 0;
  let nextTime = ctx.currentTime + 0.15;

  function lead(time: number, freq: number): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.5, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + stepDur * 0.95);
    osc.connect(g);
    g.connect(leadFilter);
    osc.start(time);
    osc.stop(time + stepDur);
  }

  function drum(time: number, strong: boolean): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(strong ? 150 : 210, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.14);
    g.gain.setValueAtTime(strong ? 0.9 : 0.45, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  function schedule(): void {
    while (nextTime < ctx.currentTime + 0.2) {
      const note = melody[step % melody.length];
      if (note !== null) lead(nextTime, note);
      if (step % 4 === 0) drum(nextTime, true);
      else if (step % 2 === 0) drum(nextTime, false);
      nextTime += stepDur;
      step += 1;
    }
  }

  const timer = setInterval(schedule, 25);

  return {
    suspend(): void {
      void ctx.suspend();
    },
    resume(): void {
      void ctx.resume();
    },
    stop(): void {
      clearInterval(timer);
      try {
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      } catch {
        // yoksay
      }
      setTimeout(() => { void ctx.close(); }, 250);
    },
  };
}
