/**
 * Synthesized Web Audio API sound & calm background music engine for Immune Blast.
 * Zero external audio files: cartoon launcher shots, bubbly impact "chpok" pops,
 * antiseptic foam blast, victory/defeat chimes, and gentle ambient marimba music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private volume = 0.75;
  private lastTickTime = 0;

  private musicTimerId: number | null = null;
  private musicStep = 0;
  private musicGain: GainNode | null = null;

  public configure(sfxEnabled: boolean, musicEnabled: boolean, volume: number): void {
    this.sfxEnabled = sfxEnabled;
    this.musicEnabled = musicEnabled;
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(
        this.musicEnabled ? 0.08 * this.volume : 0,
        this.ctx.currentTime,
        0.08
      );
    }

    if (this.musicEnabled && this.volume > 0.01) {
      if (this.ctx && this.ctx.state === 'running' && this.musicTimerId === null) {
        this.startMusicLoop();
      }
    } else {
      this.stopMusicLoop();
    }
  }

  private getOrCreateContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().then(() => {
        if (this.musicEnabled && this.volume > 0.01 && this.musicTimerId === null) {
          this.startMusicLoop();
        }
      });
    } else if (this.musicEnabled && this.volume > 0.01 && this.musicTimerId === null) {
      this.startMusicLoop();
    }
    return this.ctx;
  }

  /** Unlocks Web Audio on first touch/click so ambient music can begin smoothly. */
  public unlockAudio(): void {
    this.getOrCreateContext();
  }

  private ensureSfxContext(): AudioContext | null {
    const ctx = this.getOrCreateContext();
    if (!ctx || !this.sfxEnabled || this.volume <= 0.01) return null;
    return ctx;
  }

  private gainNode(ctx: AudioContext, level: number): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(level * this.volume, ctx.currentTime);
    g.connect(ctx.destination);
    return g;
  }

  private startMusicLoop(): void {
    if (this.musicTimerId !== null || !this.ctx) return;

    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    }

    // Calm Cmaj7 -> Am7 -> Fmaj7 -> G6 pentatonic marimba notes (Hz)
    const progression: number[][] = [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 261.63, 329.63, 392.0],
      [174.61, 220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66, 392.0],
    ];
    const melodyPattern = [0, 2, 1, 3, 2, 3, 1, 2];

    const playStep = () => {
      if (!this.ctx || !this.musicEnabled || this.volume <= 0.01 || this.ctx.state !== 'running') {
        return;
      }
      if (!this.musicGain) return;

      const chordIndex = Math.floor(this.musicStep / 8) % progression.length;
      const chord = progression[chordIndex];
      const stepInBar = this.musicStep % 8;
      const noteFreq = chord[melodyPattern[stepInBar]];
      const t = this.ctx.currentTime;

      // Soft marimba pluck
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, t);

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.linearRampToValueAtTime(0.55, t + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.68);

      osc.connect(noteGain);
      noteGain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.7);

      // Gentle warm bass pad on beat 0 and beat 4 of each bar
      if (stepInBar === 0 || stepInBar === 4) {
        const pad = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        pad.type = 'triangle';
        pad.frequency.setValueAtTime(chord[0] * 0.5, t);
        padGain.gain.setValueAtTime(0.001, t);
        padGain.gain.linearRampToValueAtTime(0.32, t + 0.15);
        padGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        pad.connect(padGain);
        padGain.connect(this.musicGain);
        pad.start(t);
        pad.stop(t + 1.85);
      }

      this.musicStep = (this.musicStep + 1) % (progression.length * 8);
    };

    playStep();
    this.musicTimerId = window.setInterval(playStep, 520);
  }

  private stopMusicLoop(): void {
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
  }

  public playUiPop(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.16);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(840, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playAimTick(): void {
    const now = performance.now();
    if (now - this.lastTickTime < 75) return;
    this.lastTickTime = now;
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.055);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playLauncherFire(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.36);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.19);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.22);

    this.playNoiseBurst(0.11, 1200, 0.16);
  }

  /** Crisp cartoon "чпок" on microbe impact */
  public playMicrobeSquish(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.22);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.045);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.085);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.095);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Bubbly "чпок" burst when a microbe pops */
  public playMicrobePop(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [520, 880, 1240].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.15);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * 0.75, t + idx * 0.018);
      osc.frequency.exponentialRampToValueAtTime(f * 1.45, t + idx * 0.018 + 0.09);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.018 + 0.11);
      osc.connect(g);
      osc.start(t + idx * 0.018);
      osc.stop(t + idx * 0.018 + 0.13);
    });
  }

  public playResistantClang(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.2);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playVaccineAura(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.14);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.24);
      osc.connect(g);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.26);
    });
  }

  public playAntibioticBlast(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.45);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.36);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.4);
    this.playNoiseBurst(0.28, 550, 0.3);
  }

  public playAntisepticBlast(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = this.gainNode(ctx, 0.42);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.42);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.46);

    // Sparkling foam chimes
    [659.25, 880, 1174.66].forEach((f, idx) => {
      const chime = ctx.createOscillator();
      const cg = this.gainNode(ctx, 0.12);
      chime.type = 'sine';
      chime.frequency.setValueAtTime(f, t + idx * 0.035);
      cg.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.035 + 0.22);
      chime.connect(cg);
      chime.start(t + idx * 0.035);
      chime.stop(t + idx * 0.035 + 0.24);
    });

    this.playNoiseBurst(0.32, 950, 0.28);
  }

  public playSplit(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [560, 780, 1020].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.14);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.11 + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13 + i * 0.02);
      osc.connect(g);
      osc.start(t + i * 0.02);
      osc.stop(t + 0.15 + i * 0.02);
    });
  }

  public playTargetCleared(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.16);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.25);
      osc.connect(g);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.27);
    });
  }

  public playVictory(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.18);
      osc.type = 'triangle';
      const start = t + idx * 0.1;
      const dur = idx === notes.length - 1 ? 0.45 : 0.15;
      osc.frequency.setValueAtTime(f, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(g);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  }

  public playDefeat(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [392, 349.23, 311.13, 261.63].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.16);
      osc.type = 'sawtooth';
      const start = t + idx * 0.14;
      osc.frequency.setValueAtTime(f, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(g);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  public playCoin(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [987.77, 1318.51].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.14);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.16);
      osc.connect(g);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.17);
    });
  }

  public playDailyReward(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99, 987.77, 1046.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = this.gainNode(ctx, 0.15);
      osc.type = 'triangle';
      const start = t + i * 0.065;
      osc.frequency.setValueAtTime(f, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(g);
      osc.start(start);
      osc.stop(start + 0.27);
    });
  }

  private playNoiseBurst(duration: number, cutoffHz: number, level: number): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoffHz;
    filter.Q.value = 0.85;

    const g = this.gainNode(ctx, level);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(g);
    src.start();
  }
}

export const soundEngine = new SoundEngine();
