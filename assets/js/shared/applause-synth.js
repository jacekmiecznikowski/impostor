/* A local, repeatable crowd-clapping PCM sample: no internet, no MP3 decoder.
   The same audio is used by the Android player and the Web Audio fallback. */
function createPartyjniakApplauseSamples(sampleRate = 22050) {
  const rate = Math.max(8000, Math.round(sampleRate));
  const duration = 3.8;
  const length = Math.ceil(rate * duration);
  const left = new Float32Array(length);
  const right = new Float32Array(length);
  let seed = 0x51e3a2f9;
  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };
  for (let clap = 0; clap < 155; clap++) {
    const start = Math.floor((.07 + random() * (duration - .3)) * rate);
    const volume = .35 + random() * .6;
    const pan = random() * 1.5 - .75;
    const leftWeight = Math.sqrt((1 - pan) / 2);
    const rightWeight = Math.sqrt((1 + pan) / 2);
    const count = Math.min(Math.floor(rate * (.08 + random() * .05)), length - start);
    let oldNoise = 0;
    for (let j = 0; j < count; j++) {
      const time = j / rate;
      const envelope = Math.exp(-time * 44)
        + (time > .012 ? .6 * Math.exp(-(time - .012) * 72) : 0)
        + (time > .029 ? .3 * Math.exp(-(time - .029) * 43) : 0);
      const noise = random() * 2 - 1;
      const bright = noise - oldNoise * .65;
      oldNoise = noise;
      const value = bright * envelope * volume;
      left[start + j] += value * leftWeight;
      right[start + j] += value * rightWeight;
    }
  }
  for (let i = 0; i < length; i++) {
    const time = i / rate;
    const fade = Math.max(0, Math.min(1, time * 4, (duration - time) * 2));
    const rustle = (random() * 2 - 1) * .025 * fade;
    left[i] += rustle;
    right[i] += rustle * .8;
  }
  let peak = 0;
  for (let i = 0; i < length; i++)
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const gain = .94 / Math.max(.001, peak);
  for (let i = 0; i < length; i++) { left[i] *= gain; right[i] *= gain; }
  return { sampleRate: rate, left, right };
}
if (typeof module !== 'undefined' && module.exports)
  module.exports = createPartyjniakApplauseSamples;
