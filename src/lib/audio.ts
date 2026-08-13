// Web Audio API Ringtone & Sound Effect Synthesizer

class SoundEffects {
  private audioCtx: AudioContext | null = null;
  private ringtoneOscillator: OscillatorNode | null = null;
  private ringtoneInterval: number | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Play Incoming Call Ringtone
  public startRingtone() {
    this.stopRingtone();
    try {
      const ctx = this.getContext();
      
      const playTone = () => {
        if (!this.audioCtx) return;
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        
        // Classic phone ring frequencies
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.setValueAtTime(0.15, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      };

      playTone();
      this.ringtoneInterval = window.setInterval(playTone, 3000);
    } catch (e) {
      console.warn('Audio ringtone error:', e);
    }
  }

  // Stop Ringtone
  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Play Dial tone for outgoing caller
  public startOutgoingTone() {
    this.stopRingtone();
    try {
      const ctx = this.getContext();
      const playDial = () => {
        if (!this.audioCtx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.0);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      };

      playDial();
      this.ringtoneInterval = window.setInterval(playDial, 3000);
    } catch (e) {
      console.warn('Outgoing dial tone error:', e);
    }
  }

  // Play call end sound
  public playEndCallTone() {
    this.stopRingtone();
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('End call sound error:', e);
    }
  }
}

export const soundEffects = new SoundEffects();
