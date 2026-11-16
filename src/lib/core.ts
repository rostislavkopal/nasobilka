/* Společné typy a pomocné funkce pro všechny moduly procvičování. */

export type Mode = "choice" | "typing";
export type TopicId = "muldiv" | "addsub" | "order" | "units" | "word";

/** Políčko pro psaní odpovědi; `suffix` je jednotka za políčkem (např. „cm“). */
export interface Slot {
  suffix?: string;
}

export interface Choice {
  label: string;
  correct: boolean;
}

/**
 * Jeden krok příkladu. Běžný příklad má jediný krok, slovní úloha tři
 * (zápis → výpočet → odpověď). Krok bez `slots` jde odpovědět jen výběrem.
 */
export interface Step {
  /** Krátký název kroku ve slovní úloze („Zápis“, „Výpočet“, „Odpověď“). */
  title?: string;
  /** Pokyn nad odpověďmi. */
  prompt: string;
  /** Levá strana rovnosti, např. „75 + 56 : 8“ nebo „4 dm 5 cm“. */
  left?: string;
  slots: Slot[];
  /** Správné hodnoty políček (stejná délka jako `slots`). */
  answer: number[];
  /** Návrhy pro režim výběru (právě jeden je správný). */
  choices: Choice[];
  /** Jemná nápověda, která neprozradí výsledek („Potřebuji nápovědu“, první chyba). */
  hint: string;
  /** Celý postup se správným výsledkem (ukáže se po druhé chybě). */
  explain: string[];
  /** Text, který po dokončení kroku zůstane vidět („Zápis: 24 : 4“). */
  done: string;
}

export interface Problem {
  id: string;
  /** Klíč pro odstranění duplicit a spárování opravy s chybou. */
  key: string;
  topic: TopicId;
  /** Štítek nad příkladem („Násobení“, „S přechodem“, …). */
  tag: string;
  /** Text slovní úlohy. */
  story?: string;
  steps: Step[];
  /** Jednořádkové shrnutí se správným výsledkem pro přehled chyb. */
  summary: string;
  /** 0 = původní příklad, 1+ = opakování po chybě v témže testu. */
  retry: number;
  /** Skupina podobných příkladů (šablona, řada násobilky …) pro rovnoměrné rozložení v testu. */
  family?: string;
}

export interface Attempt {
  problem: Problem;
  correct: boolean;
  /** Co žák odpověděl v prvním chybném kroku. */
  given?: string;
}

/** Nastavení modulu: id skupiny voleb → vybrané hodnoty. */
export type Settings = Record<string, string[]>;

/** Za kolik příkladů se chybný příklad vrátí k opakování. */
export const RETRY_GAP = 3;
export const MAX_DIGITS = 4;

/* ───────────── náhoda ───────────── */

export const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const pick = <T,>(items: readonly T[]): T => items[randInt(0, items.length - 1)];

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Opakuje `gen`, dokud nevrátí hodnotu (ne `null`). Pojistka proti nekonečné smyčce. */
export function retryUntil<T>(gen: () => T | null, tries = 500): T {
  for (let i = 0; i < tries; i++) {
    const v = gen();
    if (v !== null) return v;
  }
  throw new Error("Generátor nenašel platný příklad");
}

/* ───────────── čeština ───────────── */

/** České tvary podle čísla: 1 → one, 2–4 → few, 0 a 5+ → many. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

/** „7 jablek“, „3 jablka“, „1 jablko“. */
export const count = (n: number, one: string, few: string, many: string) =>
  `${n} ${plural(n, one, few, many)}`;

/* ───────────── odpovědi ───────────── */

export const MINUS = "−";

/** Zobrazení hodnot políček s jednotkami: [4, 5] + [dm, cm] → „4 dm 5 cm“. */
export function formatValues(slots: Slot[], values: (number | string)[]): string {
  return slots
    .map((s, i) => `${values[i] ?? "?"}${s.suffix ? ` ${s.suffix}` : ""}`)
    .join(" ");
}

const sameValues = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Sestaví návrhy odpovědí: správnou + unikátní distraktory z `candidates`
 * (jen nezáporná celá čísla). Chybějící doplní ±1…±10 u posledního políčka.
 */
export function numericChoices(
  slots: Slot[],
  answer: number[],
  candidates: number[][],
  size = 5,
): Choice[] {
  const picked: number[][] = [answer];
  const valid = (v: number[]) =>
    v.length === answer.length &&
    v.every((n) => Number.isInteger(n) && n >= 0) &&
    v.some((n) => n > 0) &&
    !picked.some((p) => sameValues(p, v));

  for (const c of shuffle(candidates)) {
    if (picked.length >= size) break;
    if (valid(c)) picked.push(c);
  }
  let delta = 1;
  for (let guard = 0; picked.length < size && guard < 100; guard++) {
    const v = [...answer];
    const last = v.length - 1;
    v[last] += Math.random() < 0.5 ? -delta : delta;
    if (valid(v)) picked.push(v);
    delta = (delta % 10) + 1;
  }
  return shuffle(
    picked.map((v, i) => ({ label: formatValues(slots, v), correct: i === 0 })),
  );
}

/** Návrhy z textových možností (první je správná); duplicity se vynechají. */
export function textChoices(correct: string, wrong: string[], size = 4): Choice[] {
  const seen = new Set([correct]);
  const out: Choice[] = [{ label: correct, correct: true }];
  for (const w of wrong) {
    if (out.length >= size) break;
    if (!seen.has(w)) {
      seen.add(w);
      out.push({ label: w, correct: false });
    }
  }
  return shuffle(out);
}

/** Jednokrokový číselný příklad „left = ?“. */
export function numericStep(
  left: string,
  answer: number,
  candidates: number[],
  explain: string[],
  hint: string,
  size = 5,
): Step {
  const slots: Slot[] = [{}];
  return {
    prompt: "Vyber správný výsledek",
    left,
    slots,
    answer: [answer],
    choices: numericChoices(slots, [answer], candidates.map((c) => [c]), size),
    explain,
    hint,
    done: `${left} = ${answer}`,
  };
}

/* ───────────── test ───────────── */

export interface VarietyOptions {
  /** Klíče příkladů z nedávných testů – losují se jen, když jiné nezbývají. */
  avoid?: ReadonlySet<string>;
  /** Kolik různých „rodin“ (šablon, řad násobilky, dvojic jednotek) generátor má. */
  families?: number;
}

/**
 * Sada `size` různých příkladů s co největší pestrostí:
 * 1. žádný příklad dvakrát v jednom testu,
 * 2. přednostně příklady, které nebyly v posledních testech (`avoid`),
 * 3. rodiny (`Problem.family`) rozložené rovnoměrně – max. ⌈size / families⌉ z jedné.
 * Pravidla se postupně uvolňují, aby generování vždy skončilo i u malé zásoby příkladů.
 */
export function uniqueSet(gen: () => Problem, size: number, opts: VarietyOptions = {}): Problem[] {
  const out: Problem[] = [];
  const seen = new Set<string>();
  const perFamily = new Map<string, number>();
  const maxPerFamily = opts.families ? Math.ceil(size / opts.families) : Infinity;
  let tries = 0;
  while (out.length < size) {
    const p = gen();
    tries++;
    const budget = tries / size;
    if (seen.has(p.key) && budget < 200) continue;
    if (opts.avoid?.has(p.key) && budget < 40) continue;
    const fam = p.family;
    if (fam !== undefined && (perFamily.get(fam) ?? 0) >= maxPerFamily && budget < 80) continue;
    seen.add(p.key);
    if (fam !== undefined) perFamily.set(fam, (perFamily.get(fam) ?? 0) + 1);
    out.push(p);
  }
  return shuffle(out);
}

/** Nová instance chybného příkladu (nové id, znovu zamíchané návrhy). */
export const retryOf = (p: Problem): Problem => ({
  ...p,
  id: uuid(),
  steps: p.steps.map((s) => ({ ...s, choices: shuffle(s.choices) })),
  retry: p.retry + 1,
});

/** Zařadí opakování chybného příkladu RETRY_GAP pozic za aktuální (nebo na konec fronty). */
export function scheduleRetry(problems: Problem[], index: number, p: Problem): Problem[] {
  const at = Math.min(index + 1 + RETRY_GAP, problems.length);
  return [...problems.slice(0, at), retryOf(p), ...problems.slice(at)];
}

/** Je odpověď v políčkách správná? */
export const checkValues = (step: Step, values: number[]) => sameValues(step.answer, values);
