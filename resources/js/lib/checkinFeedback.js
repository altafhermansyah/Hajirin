let sharedAudioContext = null;

function getAudioContext() {
    if (typeof window === 'undefined') {
        return null;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return null;
    }

    if (!sharedAudioContext) {
        sharedAudioContext = new AudioCtx();
    }

    if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
}

function playTone(ctx, frequency, startOffset, duration, type = 'sine', volume = 0.14) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startAt = ctx.currentTime + startOffset;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
}

/**
 * Play distinct Web Audio beep and optional haptic vibration for check-in results.
 * Outcomes: 'success' | 'already_used' | 'invalid'
 */
export function playCheckInFeedback(outcome, muted = false) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            if (outcome === 'success') {
                navigator.vibrate(80);
            } else if (outcome === 'already_used') {
                navigator.vibrate([70, 50, 70]);
            } else {
                navigator.vibrate([150, 60, 150]);
            }
        }
    } catch {
        // Ignore vibration failures on unsupported devices
    }

    if (muted) {
        return;
    }

    try {
        const ctx = getAudioContext();
        if (!ctx) {
            return;
        }

        if (outcome === 'success') {
            playTone(ctx, 880, 0, 0.09, 'sine', 0.14);
            playTone(ctx, 1320, 0.09, 0.13, 'sine', 0.15);
        } else if (outcome === 'already_used') {
            playTone(ctx, 520, 0, 0.09, 'triangle', 0.14);
            playTone(ctx, 520, 0.13, 0.09, 'triangle', 0.14);
        } else {
            playTone(ctx, 260, 0, 0.14, 'sawtooth', 0.1);
            playTone(ctx, 190, 0.15, 0.16, 'sawtooth', 0.1);
        }
    } catch {
        // Ignore Web Audio autoplay/context errors cleanly
    }
}
