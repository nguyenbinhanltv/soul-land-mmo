import type { ZzFxParams } from "./sfxData.ts";

// Bộ tổng hợp lấy ý tưởng từ ZzFX (MIT, Frank Force), không chép mã nguồn; không tạo AudioContext riêng.
export function createZzFxBuffer(context: BaseAudioContext, params: ZzFxParams): AudioBuffer {
  const sampleRate = context.sampleRate || 44100;
  const attack = Math.max(9, Math.round(params.attack * sampleRate));
  const release = Math.max(1, Math.round(params.release * sampleRate));
  const length = Math.max(attack + release, Math.round(params.duration * sampleRate));
  const data = new Float32Array(length);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const progress = i / length;
    const frequency = Math.max(20, params.frequency + params.slide * progress);
    phase += frequency * Math.PI * 2 / sampleRate;
    const phaseCycle = phase / (Math.PI * 2);
    const oscillator = params.shape === "square" ? (Math.sin(phase) >= 0 ? 1 : -1)
      : params.shape === "sawtooth" ? 1 - 2 * ((phaseCycle % 1 + 1) % 1)
        : params.shape === "triangle" ? 1 - 4 * Math.abs(Math.round(phaseCycle) - phaseCycle)
          : Math.sin(phase);
    const noise = params.noise * (Math.random() * 2 - 1);
    const envelope = i < attack ? i / attack : i >= length - release ? (length - i) / release : 1;
    data[i] = (oscillator * (1 - params.noise) + noise) * envelope * params.volume;
  }
  const buffer = context.createBuffer(1, length, sampleRate);
  buffer.copyToChannel(data, 0);
  return buffer;
}
