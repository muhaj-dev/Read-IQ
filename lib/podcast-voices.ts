// Voice selection for the podcast player. Reads via the device's expo-speech TTS
// (BTL has no working TTS). Curates a balanced shortlist of five real device
// voices — three female + two male, distinct, Nigerian + Enhanced-quality first.

import * as Speech from 'expo-speech';

import type { PodcastSpeaker } from '@/types/podcast';

/** Perceived gender of a device voice, used to curate + label the picker. */
export type VoiceGender = 'female' | 'male' | 'unknown';

/** A device voice, cleaned up for the picker (friendly label + quality flag). */
export type DeviceVoice = {
  /** expo-speech voice identifier passed to Speech.speak({ voice }). */
  identifier: string;
  /** Friendly display name ("Samantha") or a fallback ("Female voice 2"). */
  name: string;
  /** True for iOS Enhanced/Premium or a higher-quality network voice. */
  enhanced: boolean;
  /** Inferred gender — drives the female-forward curation and the row badge. */
  gender: VoiceGender;
  /** True for Nigerian English (en-NG) voices — surfaced regardless of gender. */
  nigerian: boolean;
  language: string;
};

/** The raw shape expo-speech returns (typed loosely to avoid SDK coupling). */
type RawVoice = { identifier?: string; name?: string; quality?: string; language?: string };

/** Gentle per-host pitch so two hosts read apart even on a single-voice device. */
export const HOST_PITCH: Record<PodcastSpeaker, number> = { A: 1.06, B: 0.94 };

/** A short line each host reads when you preview a voice in the picker. */
export const PREVIEW_LINE: Record<PodcastSpeaker, string> = {
  A: "Hey, welcome back — let's get into it.",
  B: 'Right, so let me break this idea down nice and simply.',
};

/** Speaking-speed presets shown in the picker. */
export const RATE_PRESETS = [
  { label: 'Slow', value: 0.85 },
  { label: 'Normal', value: 0.96 },
  { label: 'Fast', value: 1.1 },
] as const;

/** Default speaking speed (matches the "Normal" preset). */
export const DEFAULT_RATE = 0.96;

/** Curated shortlist: three female + two male, all distinct. */
const TARGET_FEMALE = 3;
const TARGET_MALE = 2;
const TARGET_TOTAL = 5;

/** Well-known named voices → gender (mainly Apple's; Android encodes it in the slug). */
const FEMALE_NAMES = new Set([
  'samantha', 'ava', 'allison', 'susan', 'nicky', 'zoe', 'joelle', 'karen',
  'catherine', 'kate', 'serena', 'stephanie', 'martha', 'moira', 'tessa', 'fiona',
  'veena', 'sangeeta', 'isha', 'matilda', 'nora',
]);
const MALE_NAMES = new Set([
  'aaron', 'arthur', 'daniel', 'fred', 'gordon', 'lee', 'oliver', 'rishi',
  'nathan', 'tom',
]);

/** Strip a trailing "(English (US))" and lowercase, for name-based lookups. */
function baseName(rawName: string): string {
  return rawName.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
}

/** First token of a voice name, so "Aaron (Enhanced)" still matches "aaron". */
function firstToken(rawName: string): string {
  return baseName(rawName).split(/[ ._#-]/)[0];
}

/** Gender from the slug token, then the known-name map, else unknown. */
function inferGender(rawName: string): VoiceGender {
  const lower = rawName.toLowerCase();
  if (/(?:^|[^a-z])female(?:[^a-z]|$)/.test(lower)) return 'female';
  if (/(?:^|[^a-z])male(?:[^a-z]|$)/.test(lower)) return 'male';
  const base = baseName(rawName);
  const first = firstToken(rawName);
  if (FEMALE_NAMES.has(base) || FEMALE_NAMES.has(first)) return 'female';
  if (MALE_NAMES.has(base) || MALE_NAMES.has(first)) return 'male';
  return 'unknown';
}

/** Nigerian English — by language tag (en-NG) or an explicit "nigeria" in the name. */
function isNigerian(rawName: string, language: string): boolean {
  const lang = language.toLowerCase().replace('_', '-');
  return lang.startsWith('en-ng') || /nigeria/.test(rawName.toLowerCase());
}

/** Keep female/male/Nigerian voices; drop unknown-gender novelty voices. */
function keepVoice(v: { gender: VoiceGender; nigerian: boolean }): boolean {
  return v.nigerian || v.gender === 'female' || v.gender === 'male';
}

/** Friendly name for iOS real names ("Samantha"); a labelled fallback for Android slugs. */
function displayName(rawName: string, gender: VoiceGender, index: number): string {
  const base = rawName.replace(/\s*\(.*\)\s*$/, '').trim();
  const friendly = /^[A-Za-z][A-Za-z .'’-]{1,23}$/.test(base) && !/(-x-|#|_|\d)/.test(base);
  if (friendly) return base;
  const label = gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : '';
  return label ? `${label} voice ${index + 1}` : `Voice ${index + 1}`;
}

/** Collapse iOS duplicate names (compact + enhanced) to one; keep distinct slugs apart. */
function dedupeKey(rawName: string, identifier: string): string {
  const base = rawName.replace(/\s*\(.*\)\s*$/, '').trim();
  const friendly = /^[A-Za-z][A-Za-z .'’-]{1,23}$/.test(base) && !/(-x-|#|_|\d)/.test(base);
  return friendly ? base.toLowerCase() : identifier;
}

/** Ordering group: Nigerian first, then other female, then male — female-forward. */
function groupRank(v: { gender: VoiceGender; nigerian: boolean }): number {
  if (v.nigerian) return 0;
  if (v.gender === 'female') return 1;
  return 2; // Aaron / Arthur
}

/** Take three distinct female + two distinct male voices (in order); backfill toward five. */
function curateToFive<T extends { identifier: string; gender: VoiceGender }>(list: T[]): T[] {
  const picked: T[] = [];
  const used = new Set<string>();
  const take = (pool: T[], count: number) => {
    let n = count;
    for (const v of pool) {
      if (picked.length >= TARGET_TOTAL || n <= 0) break;
      if (used.has(v.identifier)) continue;
      picked.push(v);
      used.add(v.identifier);
      n -= 1;
    }
  };
  take(list.filter((v) => v.gender === 'female'), TARGET_FEMALE);
  take(list.filter((v) => v.gender === 'male'), TARGET_MALE);
  take(list.filter((v) => !used.has(v.identifier)), TARGET_TOTAL - picked.length);
  return picked;
}

/** Load a curated shortlist of device voices (English preferred), balanced five.
 *  Returns [] when the platform exposes none (e.g. web). */
export async function loadDeviceVoices(): Promise<DeviceVoice[]> {
  let raw: RawVoice[] = [];
  try {
    raw = (await Speech.getAvailableVoicesAsync()) as RawVoice[];
  } catch {
    return [];
  }
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const usable = raw.filter((v): v is RawVoice & { identifier: string } => !!v?.identifier);
  const en = usable.filter((v) => (v.language ?? '').toLowerCase().startsWith('en'));
  const pool = en.length ? en : usable;

  const mapped = pool.map((v) => {
    const rawName = v.name ?? '';
    const language = v.language ?? '';
    return {
      identifier: v.identifier,
      rawName,
      enhanced: String(v.quality ?? '').toLowerCase() === 'enhanced',
      language,
      gender: inferGender(rawName),
      nigerian: isNigerian(rawName, language),
    };
  });

  // Drop unknown-gender novelty voices, but fall back to everything if that empties the list.
  const curated = mapped.filter(keepVoice);
  const chosen = curated.length ? curated : mapped;

  // Enhanced first for a stable dedupe (keeps the HD variant of a duplicated name).
  chosen.sort((a, b) => Number(b.enhanced) - Number(a.enhanced) || a.rawName.localeCompare(b.rawName));

  const seen = new Set<string>();
  const unique = chosen.filter((v) => {
    const key = dedupeKey(v.rawName, v.identifier);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Rank Nigerian → other female → male, HD first within each (best-first buckets).
  unique.sort(
    (a, b) =>
      groupRank(a) - groupRank(b) ||
      Number(b.enhanced) - Number(a.enhanced) ||
      a.rawName.localeCompare(b.rawName),
  );

  return curateToFive(unique).map((v, i) => ({
    identifier: v.identifier,
    name: displayName(v.rawName, v.gender, i),
    enhanced: v.enhanced,
    gender: v.gender,
    nigerian: v.nigerian,
    language: v.language,
  }));
}

/** Default host pair: top voice for A, best different-gender voice for B (else next
 *  distinct, else the same). Both null when the device has no voices. */
export function pickDefaultVoices(list: DeviceVoice[]): Record<PodcastSpeaker, string | null> {
  if (list.length === 0) return { A: null, B: null };
  const a = list[0];
  const b =
    list.find((v) => v.identifier !== a.identifier && v.gender !== a.gender) ??
    list.find((v) => v.identifier !== a.identifier) ??
    a;
  return { A: a.identifier, B: b.identifier };
}
