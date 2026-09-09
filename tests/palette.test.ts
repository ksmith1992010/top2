import { describe, expect, it } from "vitest";
import config from "../tailwind.config";

const palette = (config.theme?.extend?.colors as { top: Record<string, string> }).top;

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL = 4.5;

describe("palette contrast", () => {
  it("defines every token the app relies on", () => {
    for (const token of [
      "black",
      "surface",
      "card",
      "surface-raised",
      "border",
      "border-subtle",
      "muted",
      "text",
      "accent",
      "accent-hover",
      "accent-muted",
      "accent-soft",
      "on-accent",
    ]) {
      expect(palette[token], token).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("clears AA for body and muted text on every surface", () => {
    for (const surface of ["black", "surface", "card", "surface-raised"] as const) {
      expect(contrast(palette.text, palette[surface]), `text on ${surface}`)
        .toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrast(palette.muted, palette[surface]), `muted on ${surface}`)
        .toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("clears AA for alert text on every surface", () => {
    for (const surface of ["black", "surface", "card", "surface-raised"] as const) {
      expect(contrast(palette.accent, palette[surface]), `accent on ${surface}`)
        .toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("clears AA for label text on every red fill, resting and hovered", () => {
    for (const fill of ["accent", "accent-hover", "accent-muted", "accent-soft"] as const) {
      expect(contrast(palette["on-accent"], palette[fill]), `on-accent on ${fill}`)
        .toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("keeps on-accent dark, because white fails on every red", () => {
    // This is the reason `on-accent` exists. If someone "simplifies" it to
    // #ffffff, CTA labels drop to 3.65:1 on the primary red and this fails.
    for (const fill of ["accent", "accent-muted", "accent-soft"] as const) {
      expect(contrast("#ffffff", palette[fill]), `white on ${fill}`).toBeLessThan(AA_NORMAL);
    }
    expect(luminance(palette["on-accent"])).toBeLessThan(luminance(palette.accent));
  });
});
