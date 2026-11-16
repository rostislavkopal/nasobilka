/* Výrazy s předností operací a závorkami. Sdílí je modul „Přednost operací“ i slovní úlohy. */
import { MINUS, type Problem, type Settings, numericStep, randInt, retryUntil, uniqueSet, uuid } from "./core";

export type Op = "+" | "−" | "·" | ":";
export type Expr = number | { op: Op; l: Expr; r: Expr; paren?: boolean };

/** Horní mez pro výsledky i mezivýsledky (3. třída počítá zpaměti do 100). */
export const LIMIT = 100;

/* ───────────── stavební funkce ───────────── */

export const add = (l: Expr, r: Expr): Expr => ({ op: "+", l, r });
export const sub = (l: Expr, r: Expr): Expr => ({ op: MINUS as Op, l, r });
export const mul = (l: Expr, r: Expr): Expr => ({ op: "·", l, r });
export const div = (l: Expr, r: Expr): Expr => ({ op: ":", l, r });
/** Závorka kolem výrazu. */
export const par = (e: Expr): Expr => (typeof e === "number" ? e : { ...e, paren: true });

/* ───────────── zobrazení a výpočet ───────────── */

export function format(e: Expr): string {
  if (typeof e === "number") return String(e);
  const s = `${format(e.l)} ${e.op} ${format(e.r)}`;
  return e.paren ? `(${s})` : s;
}

/** Jedna operace se dvěma čísly; `null`, když výsledek není celé číslo v rozsahu 0…limit. */
export function apply(op: Op, a: number, b: number, limit = LIMIT): number | null {
  let v: number;
  if (op === "+") v = a + b;
  else if (op === "−") v = a - b;
  else if (op === "·") v = a * b;
  else {
    if (b === 0 || a % b !== 0) return null;
    v = a / b;
  }
  return v >= 0 && v <= limit ? v : null;
}

/**
 * Provede nejlevější operaci, jejíž oba operandy už jsou čísla. Protože strom
 * odpovídá přednosti operací a závorkám, je to přesně pořadí, ve kterém se
 * výraz počítá ve škole.
 */
function reduceOnce(e: Expr, limit: number): { next: Expr; step: string } | null {
  if (typeof e === "number") return null;
  if (typeof e.l === "number" && typeof e.r === "number") {
    const v = apply(e.op, e.l, e.r, limit);
    if (v === null) return null;
    return { next: v, step: `${e.l} ${e.op} ${e.r} = ${v}` };
  }
  if (typeof e.l !== "number") {
    const r = reduceOnce(e.l, limit);
    return r && { next: { ...e, l: r.next }, step: r.step };
  }
  const r = reduceOnce(e.r, limit);
  return r && { next: { ...e, r: r.next }, step: r.step };
}

export interface Evaluation {
  value: number;
  /** Jednotlivé dílčí výpočty: „56 : 8 = 7“, „75 + 7 = 82“. */
  steps: string[];
  /** Celý řetězec úprav: „75 + 56 : 8 = 75 + 7 = 82“. */
  chain: string;
}

/** Vyhodnotí výraz; `null`, pokud by některý mezivýsledek byl záporný, necelý nebo nad limit. */
export function evaluate(e: Expr, limit = LIMIT): Evaluation | null {
  const steps: string[] = [];
  const forms = [format(e)];
  let cur = e;
  while (typeof cur !== "number") {
    const r = reduceOnce(cur, limit);
    if (!r) return null;
    steps.push(r.step);
    cur = r.next;
    forms.push(format(cur));
  }
  return { value: cur, steps, chain: forms.join(" = ") };
}

/** Typická chyba: počítání zleva doprava bez ohledu na přednost a závorky. */
export function leftToRight(e: Expr): number | null {
  const tokens: (number | Op)[] = [];
  const walk = (x: Expr) => {
    if (typeof x === "number") tokens.push(x);
    else {
      walk(x.l);
      tokens.push(x.op);
      walk(x.r);
    }
  };
  walk(e);
  let acc = tokens[0] as number;
  for (let i = 1; i < tokens.length; i += 2) {
    const v = apply(tokens[i] as Op, acc, tokens[i + 1] as number, 1000);
    if (v === null) return null;
    acc = v;
  }
  return acc;
}

/* ───────────── šablony ───────────── */

const mulPair = () => mul(randInt(2, 9), randInt(2, 9));
const divPair = () => {
  const d = randInt(2, 9);
  return div(d * randInt(2, 9), d);
};

/** Rozdělí číslo n na dva sčítance (oba ≥ 1, první typicky větší). */
const split = (n: number): [number, number] => {
  const b = randInt(1, Math.max(1, Math.floor(n / 2)));
  return [n - b, b];
};

/** Bez závorek: násobení a dělení mají přednost před sčítáním a odčítáním. */
const plainTemplates: (() => Expr)[] = [
  () => add(randInt(10, 60), mulPair()),          // 25 + 6 · 7
  () => sub(randInt(40, 99), mulPair()),          // 90 − 8 · 6
  () => add(randInt(10, 90), divPair()),          // 75 + 56 : 8
  () => sub(randInt(20, 99), divPair()),          // 60 − 42 : 7
  () => add(mulPair(), randInt(5, 50)),           // 4 · 8 + 17
  () => sub(mulPair(), randInt(5, 40)),           // 7 · 9 − 25
  () => add(divPair(), randInt(10, 80)),          // 36 : 4 + 45
  () => add(mulPair(), mulPair()),                // 3 · 7 + 4 · 6
  () => sub(mulPair(), divPair()),                // 8 · 7 − 35 : 5
  () => add(divPair(), divPair()),                // 56 : 8 + 42 : 6
];

/** Se závorkami: nejdřív se počítá v závorce. */
const parenTemplates: (() => Expr)[] = [
  () => {                                          // (12 + 6) · 4
    const c = randInt(2, 9);
    const [a, b] = split(randInt(3, Math.floor(LIMIT / c)));
    return mul(par(add(a, b)), c);
  },
  () => {                                          // (35 − 28) · 6
    const s = randInt(2, 9);
    const b = randInt(5, 60);
    return mul(par(sub(s + b, b)), randInt(2, 9));
  },
  () => {                                          // (45 + 9) : 6
    const c = randInt(2, 9);
    const [a, b] = split(c * randInt(2, Math.floor(LIMIT / c)));
    return div(par(add(a, b)), c);
  },
  () => {                                          // (70 − 22) : 8
    const c = randInt(2, 9);
    const p = c * randInt(2, 9);
    const b = randInt(2, 40);
    return div(par(sub(p + b, b)), c);
  },
  () => {                                          // 7 · (15 − 8)
    const s = randInt(2, 9);
    const b = randInt(3, 30);
    return mul(randInt(2, 9), par(sub(s + b, b)));
  },
  () => {                                          // (45 + 9) : (12 − 6)
    const d = randInt(2, 9);
    const [a, b] = split(d * randInt(2, 9));
    const y = randInt(1, 12);
    return div(par(add(a, b)), par(sub(d + y, y)));
  },
  () => {                                          // 80 − (27 + 15)
    const a = randInt(40, 99);
    const [b, c] = split(randInt(10, a - 5));
    return sub(a, par(add(b, c)));
  },
  () => {                                          // 48 : (2 + 4)
    const d = randInt(3, 9);
    const [b, c] = split(d);
    return div(d * randInt(2, 9), par(add(b, c)));
  },
  () => {                                          // (3 + 5) · (9 − 2)
    const [a, b] = split(randInt(3, 10));
    const t = randInt(2, 9);
    const y = randInt(1, 9);
    return mul(par(add(a, b)), par(sub(t + y, y)));
  },
];

/** „Nejdřív spočítej 56 : 8.“ – první dílčí výpočet bez výsledku. */
export function firstStepHint(ev: Evaluation, withParens: boolean): string {
  const first = ev.steps[0]?.split(" = ")[0] ?? "";
  return withParens
    ? `Nejdřív spočítej, co je v závorce: ${first}.`
    : `Násobení a dělení má přednost. Nejdřív spočítej ${first}.`;
}

export type Brackets = "without" | "with" | "mixed";

export function createOrder(withParens: boolean): Problem {
  const templates = withParens ? parenTemplates : plainTemplates;
  const { e, ev, t } = retryUntil(() => {
    const t = randInt(0, templates.length - 1);
    const e = templates[t]();
    const ev = evaluate(e);
    return ev ? { e, ev, t } : null;
  });
  const left = format(e);
  const wrongOrder = leftToRight(e);
  const v = ev.value;
  return {
    id: uuid(),
    key: `order:${left}`,
    topic: "order",
    tag: withParens ? "Se závorkami" : "Bez závorek",
    steps: [
      numericStep(
        left,
        v,
        [...(wrongOrder !== null && wrongOrder !== v ? [wrongOrder, wrongOrder] : []),
          v + 1, v - 1, v + 10, v - 10, v + 2, v - 2],
        [
          withParens
            ? "Nejdřív vypočítej, co je v závorce."
            : "Násobení a dělení má přednost před sčítáním a odčítáním.",
          ...ev.steps.map((s, i) => `${i + 1}. ${s}`),
        ],
        firstStepHint(ev, withParens),
      ),
    ],
    summary: `${left} = ${v}`,
    retry: 0,
    family: `${withParens ? "p" : "n"}${t}`,
  };
}

export function createOrderTest(s: Settings, size: number, avoid?: ReadonlySet<string>): Problem[] {
  const br = (s.brackets?.[0] ?? "mixed") as Brackets;
  const families = br === "mixed" ? plainTemplates.length + parenTemplates.length : br === "with" ? parenTemplates.length : plainTemplates.length;
  return uniqueSet(() => createOrder(br === "mixed" ? Math.random() < 0.5 : br === "with"), size, { avoid, families });
}
