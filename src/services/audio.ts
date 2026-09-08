/**
 * Web Audio API based procedural security music and ambient audio engine.
 * Generates low-sound professional security command center music, cyber ambient, and audio cues.
 */

export type SecurityTrackId = 'SURVEILLANCE_SOC' | 'NIGHT_PATROL' | 'CYBER_MATRIX';

export interface SecurityTrackInfo {
  id: SecurityTrackId;
  name: string;
  genre: string;
  bpm: number;
  description: string;
}

export const SECURITY_TRACKS: SecurityTrackInfo[] = [
  {
    id: 'SURVEILLANCE_SOC',
    name: 'Surveillance Command (SOC)',
    genre: 'Cinematic Ambient',
    bpm: 68,
    description: 'Deep sub-bass drone, warm security pad, and periodic perimeter radar sonar ping.'
  },
  {
    id: 'NIGHT_PATROL',
    name: 'Night Perimeter Patrol',
    genre: 'Minimal Surveillance Pulse',
    bpm: 76,
    description: 'Methodical low-frequency pulse, minor chords, and discreet perimeter monitoring rhythm.'
  },
  {
    id: 'CYBER_MATRIX',
    name: 'Cyber Perimeter Matrix',
    genre: 'High-Tech Arpeggio',
    bpm: 82,
    description: 'Hypnotic sequenced notes, subtle resonant low-pass filter, and soothing cyber ambience.'
  }
];

export interface AudioEngineState {
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
  currentTrackId: SecurityTrackId;
}

type StateListener = (state: AudioEngineState) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Music state
  private isPlayingMusic: boolean = false;
  private currentTrack: SecurityTrackId = 'SURVEILLANCE_SOC';
  private volume: number = 0.50; // Increased default volume to 50% for clear audibility

  // Scheduler state
  private schedulerTimer: number | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private activePadNodes: { oscs: OscillatorNode[]; gain: GainNode }[] = [];

  // Listeners
  private listeners: Set<StateListener> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // Master output filter (gentle low-pass to guarantee low, non-fatiguing sound)
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);

      // Music Gain node
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Master Gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Connect graph: Music -> MasterFilter -> MusicGain -> Analyser -> MasterGain -> Destination
      this.masterFilter.connect(this.musicGain);
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState(): AudioEngineState {
    return {
      isPlaying: this.isPlayingMusic,
      volume: this.volume,
      currentTrackId: this.currentTrack
    };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setTrack(trackId: SecurityTrackId) {
    if (this.currentTrack !== trackId) {
      this.currentTrack = trackId;
      if (this.isPlayingMusic) {
        // Smoothly restart with the new track sequence
        this.stopScheduler();
        this.startScheduler();
      }
      this.notify();
    }
  }

  public getTrack(): SecurityTrackId {
    return this.currentTrack;
  }

  public isMusicPlaying(): boolean {
    return this.isPlayingMusic;
  }

  // Backward compatibility methods
  public isAmbientActive(): boolean {
    return this.isPlayingMusic;
  }

  public startAmbient() {
    this.startMusic();
  }

  public stopAmbient() {
    this.stopMusic();
  }

  public toggleAmbient(): boolean {
    return this.toggleMusic();
  }

  public toggleMusic(): boolean {
    if (this.isPlayingMusic) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public startMusic(trackId?: SecurityTrackId) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterFilter) return;

      if (trackId) {
        this.currentTrack = trackId;
      }

      if (this.isPlayingMusic) return;

      this.isPlayingMusic = true;
      this.currentStep = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.05;

      this.startScheduler();
      this.notify();
    } catch {
      // Graceful fallback for restricted autoplay
    }
  }

  public stopMusic() {
    this.isPlayingMusic = false;
    this.stopScheduler();
    this.notify();
  }

  private startScheduler() {
    this.stopScheduler();

    // Loop interval checks every 50ms to schedule ahead
    this.schedulerTimer = window.setInterval(() => {
      if (!this.ctx || !this.isPlayingMusic) return;

      const lookAhead = 0.2; // schedule 200ms ahead
      while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
        this.scheduleStep(this.nextNoteTime, this.currentStep);
        this.advanceStep();
      }
    }, 50);
  }

  private stopScheduler() {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    // Fade out active pad notes
    this.activePadNodes.forEach(item => {
      try {
        if (this.ctx) {
          item.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
          setTimeout(() => {
            item.oscs.forEach(o => {
              try { o.stop(); o.disconnect(); } catch {}
            });
            try { item.gain.disconnect(); } catch {}
          }, 300);
        }
      } catch {}
    });
    this.activePadNodes = [];
  }

  private advanceStep() {
    const trackInfo = SECURITY_TRACKS.find(t => t.id === this.currentTrack) || SECURITY_TRACKS[0];
    const secondsPerBeat = 60.0 / trackInfo.bpm;
    // 16th note steps: 4 steps per beat
    const stepDuration = secondsPerBeat / 4.0;
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop (16 steps * 4 bars)
  }

  private scheduleStep(time: number, step: number) {
    if (!this.ctx || !this.masterFilter) return;

    if (this.currentTrack === 'SURVEILLANCE_SOC') {
      this.scheduleSurveillanceSOC(time, step);
    } else if (this.currentTrack === 'NIGHT_PATROL') {
      this.scheduleNightPatrol(time, step);
    } else {
      this.scheduleCyberMatrix(time, step);
    }
  }

  /**
   * TRACK 1: Surveillance Command (SOC)
   * Deep sub-bass, mysterious minor pads, low soft radar sonar ping, calm security drone
   */
  private scheduleSurveillanceSOC(time: number, step: number) {
    if (!this.ctx || !this.masterFilter) return;

    // Chords change every 16 steps (1 bar)
    // Progression: Dm9 (bar 0), Bbmaj7 (bar 1), Gm7 (bar 2), Asus4 (bar 3)
    if (step % 16 === 0) {
      const bar = Math.floor(step / 16);
      const chordFrequencies = [
        [73.42, 146.83, 220.0, 261.63, 329.63], // Dm9 (D2, D3, A3, C4, E4)
        [58.27, 116.54, 233.08, 293.66, 349.23], // Bbmaj7 (Bb1, Bb2, Bb3, D4, F4)
        [49.00, 98.00, 196.00, 293.66, 349.23],  // Gm7 (G1, G2, G3, D4, F4)
        [55.00, 110.00, 220.0, 293.66, 329.63]   // Asus4 (A1, A2, A3, D4, E4)
      ][bar % 4];

      this.playAtmosphericPad(time, chordFrequencies, 3.5);
    }

    // Sub-bass pulse on step 0 and 8 (beats 1 and 3)
    if (step % 8 === 0) {
      const bassNotes = [36.71, 29.14, 24.50, 27.50]; // D1, Bb0, G0, A0
      const note = bassNotes[Math.floor(step / 16) % 4];
      this.playSubBassPulse(time, note, 0.6);
    }

    // Perimeter Radar Sonar Ping every 32 steps (every 2 bars on step 12)
    if (step === 12 || step === 44) {
      this.playRadarSonarPing(time, 1318.51); // E6 ping
    }

    // Ambient arpeggio note every 4 steps (8th notes)
    if (step % 4 === 2) {
      const arpNotes = [220.0, 261.63, 329.63, 440.0, 523.25, 659.25];
      const note = arpNotes[(step / 2) % arpNotes.length];
      this.playSoftSynthPluck(time, note, 0.055, 0.35);
    }
  }

  /**
   * TRACK 2: Night Perimeter Patrol
   * Rhythmic heartbeat, soft shaker pulse, low sub drone, focused surveillance atmosphere
   */
  private scheduleNightPatrol(time: number, step: number) {
    if (!this.ctx || !this.masterFilter) return;

    // Pad every 16 steps: Am7 -> Em7 -> Fmaj7 -> Gsus4
    if (step % 16 === 0) {
      const bar = Math.floor(step / 16);
      const chordFrequencies = [
        [55.0, 110.0, 220.0, 261.63, 329.63], // Am7
        [41.2, 82.41, 164.81, 246.94, 329.63], // Em7
        [43.65, 87.31, 174.61, 261.63, 329.63], // Fmaj7
        [49.0, 98.0, 196.0, 293.66, 392.0]     // Gsus4
      ][bar % 4];

      this.playAtmosphericPad(time, chordFrequencies, 3.2);
    }

    // Heartbeat security kick on beats 1 and 3 (step 0 and 8)
    if (step % 8 === 0) {
      this.playHeartbeatKick(time);
    }

    // Subtle patrol hi-hat / tick pulse on 8th notes (step % 4 === 0)
    if (step % 4 === 0) {
      this.playSoftTick(time, step % 8 === 4 ? 0.045 : 0.028);
    }

    // Low bass groove note
    if (step % 8 === 4 || step % 8 === 6) {
      const bar = Math.floor(step / 16);
      const roots = [55.0, 82.41, 87.31, 98.0];
      this.playSubBassPulse(time, roots[bar % 4], 0.25);
    }
  }

  /**
   * TRACK 3: Cyber Perimeter Matrix
   * Hypnotic high-tech sequencer notes, resonant low-pass sweep, cyber monitoring vibe
   */
  private scheduleCyberMatrix(time: number, step: number) {
    if (!this.ctx || !this.masterFilter) return;

    // Ambient background wash every 16 steps
    if (step % 16 === 0) {
      const bar = Math.floor(step / 16);
      const chordFrequencies = [
        [65.41, 130.81, 196.0, 261.63, 311.13], // Cm7
        [58.27, 116.54, 174.61, 233.08, 349.23], // Bb
        [51.91, 103.83, 155.56, 207.65, 311.13], // Abmaj7
        [49.00, 98.00, 146.83, 220.00, 293.66]   // Gm7
      ][bar % 4];

      this.playAtmosphericPad(time, chordFrequencies, 3.0);
    }

    // Fast 16th-note soft high-tech cyber blips
    const matrixScale = [261.63, 311.13, 392.0, 466.16, 523.25, 622.25];
    const note = matrixScale[step % matrixScale.length];
    // Gentle volume, soft attack and decay
    this.playSoftSynthPluck(time, note, 0.048, 0.12);

    // Deep sub-pulse every 16 steps
    if (step % 16 === 0) {
      this.playSubBassPulse(time, 32.7, 1.2);
    }
  }

  /**
   * Generates warm, low-frequency atmospheric pads that breathe softly.
   */
  private playAtmosphericPad(time: number, freqs: number[], duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, time);
    padGain.gain.linearRampToValueAtTime(0.085, time + duration * 0.3);
    padGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Low-pass filter for the pad so it stays warm and low-frequency
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, time);
    filter.frequency.exponentialRampToValueAtTime(1100, time + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(500, time + duration);

    padGain.connect(filter);
    filter.connect(this.masterFilter);

    const oscs: OscillatorNode[] = [];
    freqs.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      // Slight detune for analog warmth
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, time);
      osc.connect(padGain);
      osc.start(time);
      osc.stop(time + duration);
      oscs.push(osc);
    });

    const padNode = { oscs, gain: padGain };
    this.activePadNodes.push(padNode);

    // Cleanup reference after note completes
    setTimeout(() => {
      const idx = this.activePadNodes.indexOf(padNode);
      if (idx !== -1) {
        this.activePadNodes.splice(idx, 1);
      }
    }, (duration + 0.5) * 1000);
  }

  /**
   * Deep sub-bass pulse (low sine wave between 25Hz and 80Hz)
   */
  private playSubBassPulse(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * High-tech radar / perimeter sonar ping (clean high sine with exponential decay)
   */
  private playRadarSonarPing(time: number, freq: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Subtle gentle ping
    gain.gain.setValueAtTime(0.055, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + 1.6);
  }

  /**
   * Melodic pluck note
   */
  private playSoftSynthPluck(time: number, freq: number, peakGain: number, duration: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakGain, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Heartbeat kick thump for surveillance rhythm
   */
  private playHeartbeatKick(time: number) {
    if (!this.ctx || !this.masterFilter) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.15);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  /**
   * Surveillance clock tick / hi-hat
   */
  private playSoftTick(time: number, peakGain: number) {
    if (!this.ctx || !this.masterFilter) return;

    // Filtered noise or triangle burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, time);

    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    osc.connect(gain);
    gain.connect(this.masterFilter);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  // --- CRITICAL ALERT & FEEDBACK AUDIO CUES ---

  /**
   * Pleasant positive confirmation chime (e.g. Barrier Open, Vehicle Approved)
   */
  public playSuccessChime() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.masterGain);

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Alert or security warning beep
   */
  public playWarningSound() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.masterGain);

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.1);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  /**
   * Emergency high-priority security alarm chime
   */
  public playEmergencyAlarm() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.masterGain);

        const startTime = now + i * 0.22;
        osc.frequency.setValueAtTime(880, startTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, startTime + 0.18);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      }
    } catch {}
  }
}

export const soundEngine = new SoundEngine();

