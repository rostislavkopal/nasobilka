/* Hvězdičky a nejlepší výsledky uložené v prohlížeči (jen pro tohoto žáka na tomto zařízení). */
import type { Settings, TopicId } from "./core";

export interface TopicStats {
  stars: number;
  tests: number;
  /** Nejlepší úspěšnost prvního pokusu v procentech. */
  best: number;
}

export type Stats = Partial<Record<TopicId, TopicStats>>;

const STATS_KEY = "nasobilka.stats.v1";
/** v2: volby jsou jednovýběrové (s hodnotou „both“) a přibyl počet příkladů. */
const SETTINGS_KEY = "nasobilka.settings.v2";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* soukromé okno / zablokované úložiště – aplikace funguje i bez něj */
  }
}

export const loadStats = (): Stats => read<Stats>(STATS_KEY, {});

export function recordTest(topic: TopicId, stars: number, percent: number): Stats {
  const all = loadStats();
  const prev = all[topic] ?? { stars: 0, tests: 0, best: 0 };
  all[topic] = { stars: prev.stars + stars, tests: prev.tests + 1, best: Math.max(prev.best, percent) };
  write(STATS_KEY, all);
  return all;
}

export const loadSettings = () => read<Partial<Record<TopicId, Settings>> & { mode?: string }>(SETTINGS_KEY, {});
export const saveSettings = (s: Partial<Record<TopicId, Settings>> & { mode?: string }) => write(SETTINGS_KEY, s);

/* ───────────── nedávné příklady (pestrost mezi testy) ───────────── */

const RECENT_KEY = "nasobilka.recent.v1";
/** Pamatují se klíče příkladů z posledních tří testů (3 × max. 20). */
const RECENT_LIMIT = 60;

export function loadRecent(topic: TopicId): Set<string> {
  const all = read<Partial<Record<TopicId, string[]>>>(RECENT_KEY, {});
  return new Set(all[topic] ?? []);
}

export function rememberRecent(topic: TopicId, keys: string[]) {
  const all = read<Partial<Record<TopicId, string[]>>>(RECENT_KEY, {});
  all[topic] = [...keys, ...(all[topic] ?? []).filter((k) => !keys.includes(k))].slice(0, RECENT_LIMIT);
  write(RECENT_KEY, all);
}
