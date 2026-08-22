import { readFile, writeFile } from "node:fs/promises";

const logPath = "/home/ubuntu/hh-goa-voice-rag/full-sequence-upload.log";
const outputPath = "/home/ubuntu/hh-goa-voice-rag/client/src/lib/fullSequenceFrames.ts";
const log = await readFile(logPath, "utf8");

const matches = [...log.matchAll(/mic-sequence-(\d{3})\.webp -> (\/manus-storage\/[^\s]+)/g)]
  .map((match) => ({ index: Number(match[1]), url: match[2] }))
  .sort((a, b) => a.index - b.index);

if (matches.length !== 149 || matches.some((frame, index) => frame.index !== index)) {
  throw new Error(`Expected contiguous 149-frame upload list, found ${matches.length} frames.`);
}

const source = `/**\n * Field Notes / Signal design reminder:\n * This typed asset list represents every uploaded microphone animation frame.\n * Keep the ordered sequence intact so scroll playback stays frame-accurate.\n */\nexport const fullSequenceFrames = [\n${matches.map((frame) => `  "${frame.url}",`).join("\n")}\n] as const;\n`;

await writeFile(outputPath, source);
console.log(`Wrote ${matches.length} ordered storage URLs to ${outputPath}`);
