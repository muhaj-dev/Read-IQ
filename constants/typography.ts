// Font families from the design mocks: Manrope (headings) · Hanken Grotesk (body).
// Each weight is its own family — never pair with fontWeight, or Android falls back to system font.

export const fonts = {
  // Headlines & display — Manrope
  headingMedium: 'Manrope_500Medium',
  headingSemibold: 'Manrope_600SemiBold',
  headingBold: 'Manrope_700Bold',
  headingExtrabold: 'Manrope_800ExtraBold',
  // Body & labels — Hanken Grotesk
  bodyRegular: 'HankenGrotesk_400Regular',
  bodyItalic: 'HankenGrotesk_400Regular_Italic', // real face — Android won't synthesize italics
  bodyMedium: 'HankenGrotesk_500Medium',
  bodySemibold: 'HankenGrotesk_600SemiBold',
  bodyBold: 'HankenGrotesk_700Bold',
} as const;
