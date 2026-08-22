import { describe, expect, it } from "vitest";

function makeSilentWav(sampleRate = 16_000, durationMs = 120): Uint8Array {
  const sampleCount = Math.round((sampleRate * durationMs) / 1000);
  const dataSize = sampleCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));

  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, dataSize, true);
  return new Uint8Array(buffer);
}

describe("Sarvam server credential", () => {
  it("is accepted by the documented speech-to-text endpoint", async () => {
    const apiKey = process.env.SARVAM_API_KEY;
    expect(apiKey).toBeTruthy();

    const form = new FormData();
    form.set("file", new Blob([makeSilentWav()], { type: "audio/wav" }), "credential-probe.wav");
    form.set("model", "saaras:v3");
    form.set("mode", "transcribe");
    form.set("language_code", "unknown");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": apiKey! },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });

    expect([401, 403]).not.toContain(response.status);
    expect(response.status).toBeLessThan(500);
  }, 25_000);
});
