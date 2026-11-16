/* Převody jednotek délky m, dm, cm, mm. */
import { expand } from "./expand";
import { type Problem, type Settings, type Slot, type Step, numericChoices, pick, randInt, retryUntil, uniqueSet, uuid } from "./core";

export const UNITS = [
  { id: "m", mm: 1000 },
  { id: "dm", mm: 100 },
  { id: "cm", mm: 10 },
  { id: "mm", mm: 1 },
] as const;

type Unit = (typeof UNITS)[number];
export type UnitKind = "simple" | "compound";

/** Největší číslo, které se v převodech objeví (číselný obor 3. třídy). */
export const UNIT_LIMIT = 1000;

/** Dvojice jednotek (větší, menší) – sousední, nebo libovolné. */
function unitPair(neighborsOnly: boolean, maxRatio: number): [Unit, Unit] {
  return retryUntil(() => {
    const i = randInt(0, UNITS.length - 2);
    const j = neighborsOnly ? i + 1 : randInt(i + 1, UNITS.length - 1);
    return UNITS[i].mm / UNITS[j].mm <= maxRatio ? [UNITS[i], UNITS[j]] : null;
  });
}

const rel = (big: Unit, small: Unit) => `1 ${big.id} = ${big.mm / small.mm} ${small.id}`;

function step(left: string, slots: Slot[], answer: number[], candidates: number[][], explain: string[]): Step {
  const r = explain[0];
  return {
    hint: `Pamatuj: ${r}.`,
    prompt: "Vyber správný převod",
    left,
    slots,
    answer,
    choices: numericChoices(slots, answer, candidates, 4),
    explain,
    done: left,
  };
}

/** 3 m = … cm  nebo  400 cm = … m */
function simple(neighborsOnly: boolean): { key: string; step: Step } {
  const [big, small] = unitPair(neighborsOnly, 1000);
  const r = big.mm / small.mm;
  const x = randInt(1, Math.min(r === 10 ? 30 : 9, Math.floor(UNIT_LIMIT / r)));
  const n = x * r;
  if (Math.random() < 0.5) {
    // větší → menší
    return {
      key: `u:${x}${big.id}>${small.id}`,
      step: step(`${x} ${big.id}`, [{ suffix: small.id }], [n],
        [[n * 10], [n / 10], [x], [x + r], [n + r]],
        [rel(big, small), `${x} · ${r} = ${n}, takže ${x} ${big.id} = ${n} ${small.id}`]),
    };
  }
  // menší → větší
  return {
    key: `u:${n}${small.id}>${big.id}`,
    step: step(`${n} ${small.id}`, [{ suffix: big.id }], [x],
      [[x * 10], [n], [n / 100], [x + 1], [x - 1]],
      [rel(big, small), `${n} : ${r} = ${x}, takže ${n} ${small.id} = ${x} ${big.id}`]),
  };
}

/** 4 dm 5 cm = … cm  nebo  45 cm = … dm … cm (poměr jednotek 10 nebo 100) */
function compound(neighborsOnly: boolean): { key: string; step: Step } {
  const [big, small] = unitPair(neighborsOnly, 100);
  const r = big.mm / small.mm;
  const x = randInt(1, 9);
  const y = randInt(1, r - 1);
  const n = x * r + y;
  const bigPart = x * r;
  if (Math.random() < 0.5) {
    return {
      key: `u:${x}${big.id}${y}${small.id}>${small.id}`,
      step: step(`${x} ${big.id} ${y} ${small.id}`, [{ suffix: small.id }], [n],
        [[Number(`${x}0${y}`)], [n * 10], [x + y], [Number(`${y}${x}`)], [bigPart]],
        [rel(big, small), `${x} ${big.id} = ${bigPart} ${small.id}`, `${bigPart} ${small.id} + ${y} ${small.id} = ${n} ${small.id}`]),
    };
  }
  return {
    key: `u:${n}${small.id}>${big.id}${small.id}`,
    step: step(`${n} ${small.id}`, [{ suffix: big.id }, { suffix: small.id }], [x, y],
      [[y, x], [x * 10, y], [x, y * 10], [0, n], [n, 0], [x + 1, y], [x, r - y]],
      [rel(big, small), `${n} ${small.id} = ${bigPart} ${small.id} + ${y} ${small.id}`, `${bigPart} ${small.id} = ${x} ${big.id}`, `Výsledek: ${x} ${big.id} ${y} ${small.id}`]),
  };
}

export function createUnits(kind: UnitKind, neighborsOnly: boolean): Problem {
  const { key, step } = kind === "simple" ? simple(neighborsOnly) : compound(neighborsOnly);
  const answer = step.slots.map((s, i) => `${step.answer[i]} ${s.suffix}`).join(" ");
  step.done = `${step.left} = ${answer}`;
  return {
    id: uuid(),
    key,
    topic: "units",
    tag: kind === "simple" ? "Celé jednotky" : "Složené jednotky",
    steps: [step],
    summary: step.done,
    retry: 0,
    family: key.replace(/[0-9]/g, ""),
  };
}

export function createUnitsTest(s: Settings, size: number, avoid?: ReadonlySet<string>): Problem[] {
  const kinds = expand(s, "kinds", ["simple", "compound"]) as UnitKind[];
  const neighborsOnly = (s.pairs?.[0] ?? "neighbors") === "neighbors";
  // sousední: 3 dvojice × 2 směry; všechny: 6 dvojic × 2 směry (na typ převodu)
  const families = (neighborsOnly ? 6 : 12) * kinds.length;
  return uniqueSet(() => createUnits(pick(kinds), neighborsOnly), size, { avoid, families });
}
