/**
 * 100 frame sequence from Video Frame (001.png to 100.png).
 */
export const fullSequenceFrames = Array.from(
  { length: 100 },
  (_, i) => `/frames/${String(i + 1).padStart(3, "0")}.png`
);
