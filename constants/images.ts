// Centralized image imports (see AGENTS.md → Image Rule). Never import assets directly in screens.

const mark = require('@/assets/images/brand/noteiq-mark.png'); // square "✦ IQ" glyph
const wordmark = require('@/assets/images/brand/noteiq-wordmark.png'); // full "noteIQ" lockup
const readiqMark = require('@/assets/images/brand/readiq-iqmark.png'); // clean "✦ IQ" glyph (wordmark crop, no "read")
const readiqWordmark = require('@/assets/images/brand/readiq-wordmark.png'); // full "readIQ" lockup

export const images = { mark, wordmark, readiqMark, readiqWordmark };

// Intrinsic aspect ratios (height / width) — size the logo by width, keep proportions.
export const brandAspect = {
  mark: 811 / 587,
  wordmark: 599 / 969,
  readiqMark: 548 / 472,
  readiqWordmark: 584 / 983,
} as const;
