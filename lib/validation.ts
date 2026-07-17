// Lightweight input validators shared across onboarding + profile.

/** True for a plausibly-valid email (one @, a dot in the domain, no spaces). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
