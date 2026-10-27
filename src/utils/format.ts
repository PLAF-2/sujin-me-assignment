/** Two-digit archive-style counter: 7 → "07". */
export const pad = (n: number) => String(n).padStart(2, '0');

/** Local wall-clock time as HH:MM:SS. */
export const formatTime = (epochMs: number) => {
  const d = new Date(epochMs);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad).join(':');
};

/** True when the last Hangul syllable of `word` has a final consonant (받침). */
const hasFinalConsonant = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

/** 을/를 */
export const withObjectParticle = (word: string) => word + (hasFinalConsonant(word) ? '을' : '를');

/** 은/는 */
export const withTopicParticle = (word: string) => word + (hasFinalConsonant(word) ? '은' : '는');

/** 과/와 */
export const withAndParticle = (word: string) => word + (hasFinalConsonant(word) ? '과' : '와');

/** Thousands separators: 20160 → "20,160". */
export const formatCount = (n: number) => n.toLocaleString('ko-KR');

/** Replaces {key} placeholders with values: fillCounts('{d}개', { d: 6 }) → "6개". */
export const fillCounts = (template: string, values: Record<string, number>) =>
  template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
