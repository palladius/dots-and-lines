/**
 * SoundEngine.js — Web Audio Arcade Synthesizer & Combo Scale Engine
 *
 * Implements:
 * - Crisp laser click on segment placement
 * - Ascending C-Major scale (Do-Re-Mi-Fa-Sol-La-Si-Do) on consecutive box captures (Combo Streak)
 * - Stadium fanfare arpeggio on victory
 * - Optional enthusiastic Web Speech kid-safe voice callouts (IT / EN)
 */

// C5 Major scale frequencies (Do5 -> Do6 -> Mi6 -> Sol6)
const COMBO_SCALE_HZ = [
  523.25, // 1: Do5 (C5)
  587.33, // 2: Re5 (D5)
  659.25, // 3: Mi5 (E5)
  698.46, // 4: Fa5 (F5)
  783.99, // 5: Sol5 (G5)
  880.00, // 6: La5 (A5)
  987.77, // 7: Si5 (B5)
  1046.50, // 8: Do6 (C6)
  1174.66, // 9: Re6 (D6)
  1318.51, // 10: Mi6 (E6)
  1567.98, // 11: Sol6 (G6)
];

const COMBO_SOLFEGE = ['DO!', 'RE!', 'MI!', 'FA!', 'SOL!', 'LA!', 'SI!', 'DO ALTO!', 'SUPER RE!', 'MEGA MI!', 'ULTRA SOL!'];

export class SoundEngine {
  constructor() {
    this.enabled = true;
    this.voiceEnabled = false;
    this.ctx = null;
    try {
      const saved = localStorage.getItem('dots_sound_enabled_v1');
      if (saved === 'false') this.enabled = false;
      const savedVoice = localStorage.getItem('dots_voice_enabled_v1');
      if (savedVoice === 'true') this.voiceEnabled = true;
    } catch {}
  }

  _ensureCtx() {
    if (!this.enabled) return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    try {
      localStorage.setItem('dots_sound_enabled_v1', String(this.enabled));
    } catch {}
    if (this.enabled) {
      this.playLineClick();
    }
    return this.enabled;
  }

  toggle() {
    return this.setEnabled(!this.enabled);
  }

  setVoiceEnabled(val) {
    this.voiceEnabled = Boolean(val);
    try {
      localStorage.setItem('dots_voice_enabled_v1', String(this.voiceEnabled));
    } catch {}
    return this.voiceEnabled;
  }

  getSolfegeLabel(comboStep = 1) {
    const idx = Math.max(0, Math.min(COMBO_SOLFEGE.length - 1, (comboStep || 1) - 1));
    return COMBO_SOLFEGE[idx];
  }

  haptic(ms = 12) {
    try {
      if (this.enabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(ms);
      }
    } catch {}
  }

  playLineClick() {
    this.haptic(10);
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.065);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  playBoxCombo(comboStep = 1, boxesInMove = 1) {
    this.haptic(boxesInMove > 1 ? [20, 30, 35] : 22);
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const idx = Math.max(0, Math.min(COMBO_SCALE_HZ.length - 1, (comboStep || 1) - 1));
      const baseFreq = COMBO_SCALE_HZ[idx];

      // Main crystalline bell note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq * 0.96, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.03);

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.34);

      // Harmonic 5th / Octave shimmer for combo >= 2 or double box
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
      shimmerGain.gain.setValueAtTime(0.11, now + 0.04);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.04);
      shimmerOsc.stop(now + 0.3);
    } catch {}
  }

  playUndo() {
    this.haptic(8);
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.11);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  playVictoryFanfare(isTie = false) {
    this.haptic([30, 40, 60, 40, 90]);
    const ctx = this._ensureCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = isTie
        ? [440, 523.25, 659.25, 587.33]
        : [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const start = now + i * 0.11;
        const dur = i === notes.length - 1 ? 0.45 : 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch {}
  }

  speak(text, lang = 'it') {
    if (!this.enabled || !this.voiceEnabled) return;
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = lang === 'en' ? 'en-US' : 'it-IT';
        utter.rate = 1.1;
        utter.pitch = 1.12;
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  }
}
