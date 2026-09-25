export type Mode = "choice" | "typing";
export type Operation = "mul" | "div";

export interface Problem {
  id: string;
  a: number;
  b: number;
  op: Operation;
  left: number;
  right: number;
  answer: number;
  options: number[];
  /** 0 = původní příklad, 1+ = opakování po chybě v témže testu */
  retry: number;
}

export interface Attempt {
  problem: Problem;
  given: number | null;
  correct: boolean;
}

export interface TestOptions {
  operations: Operation[];
  maxFactor: number;
}

export const QUESTIONS_PER_TEST = 20;
export const OPTION_COUNT = 5;
/** Za kolik příkladů se chybný příklad vrátí k opakování. */
export const RETRY_GAP = 3;

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(items: readonly T[]): T => items[randInt(0, items.length - 1)];

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 5 unikátních kladných celých čísel včetně správného výsledku, zamíchané. */
export function buildOptions(p: Pick<Problem, "a" | "b" | "op" | "answer">): number[] {
  const { a, b, op, answer } = p;
  const candidates: number[] = [];

  if (op === "mul") {
    // sousední násobky, záměna činitele, sčítání místo násobení, ±1…±10
    candidates.push(
      (a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1),
      a + b, answer + 10, answer - 10, answer + 1, answer - 1,
      answer + 2, answer - 2, (a + 1) * (b + 1),
    );
  } else {
    // výsledek dělení je malé číslo: sousední hodnoty, dělitel, …
    candidates.push(
      answer + 1, answer - 1, answer + 2, answer - 2, b,
      answer + 3, answer - 3, answer * 2, answer + 10,
    );
  }

  const set = new Set<number>([answer]);
  for (const c of shuffle(candidates)) {
    if (set.size >= OPTION_COUNT) break;
    if (Number.isInteger(c) && c > 0) set.add(c);
  }
  // pojistka: doplnit ±1…±10
  let delta = 1;
  while (set.size < OPTION_COUNT) {
    const c = answer + (Math.random() < 0.5 ? -delta : delta);
    if (c > 0) set.add(c);
    delta = (delta % 10) + 1;
  }
  return shuffle([...set]);
}

export function createProblem({ operations, maxFactor }: TestOptions): Problem {
  const op = pick(operations);
  const a = randInt(1, maxFactor);
  const b = randInt(1, maxFactor);
  const base =
    op === "mul"
      ? { a, b, op, left: a, right: b, answer: a * b }
      : { a, b, op, left: a * b, right: b, answer: a };
  return { id: uuid(), ...base, options: buildOptions(base), retry: 0 };
}

const keyOf = (p: Problem) => `${p.op}:${p.left}:${p.right}`;

export function createTest(opts: TestOptions, count = QUESTIONS_PER_TEST): Problem[] {
  const out: Problem[] = [];
  const seen = new Set<string>();
  let tries = 0;
  while (out.length < count) {
    const p = createProblem(opts);
    tries++;
    if (seen.has(keyOf(p)) && tries < count * 40) continue;
    seen.add(keyOf(p));
    out.push(p);
  }
  return out;
}

/** Nová instance chybného příkladu (nové id, znovu zamíchané možnosti). */
export const retryOf = (p: Problem): Problem => ({
  ...p,
  id: uuid(),
  options: buildOptions(p),
  retry: p.retry + 1,
});

/** Zařadí opakování chybného příkladu RETRY_GAP pozic za aktuální (nebo na konec fronty). */
export function scheduleRetry(problems: Problem[], index: number, p: Problem): Problem[] {
  const at = Math.min(index + 1 + RETRY_GAP, problems.length);
  return [...problems.slice(0, at), retryOf(p), ...problems.slice(at)];
}

export const opSymbol = (op: Operation) => (op === "mul" ? "·" : ":");

export const formatProblem = (p: Problem) => `${p.left} ${opSymbol(p.op)} ${p.right}`;
