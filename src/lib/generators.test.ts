import { describe, expect, it } from "vitest";
import { type Problem, formatValues, plural } from "./core";
import { createAddSub } from "./addsub";
import { createOrder, evaluate, format, leftToRight } from "./expr";
import { createMulDiv } from "./muldiv";
import { TOPICS } from "./topics";
import { UNITS, createUnits } from "./units";
import { createWord } from "./word";

const N = 3000;

/** Nezávislý výpočet zobrazeného výrazu (· → *, : → /, − → -) pomocí JS. */
const jsEval = (s: string): number =>
  Function(`"use strict"; return (${s.replace(/·/g, "*").replace(/:/g, "/").replace(/−/g, "-")});`)();

const mmOf = (unit: string) => UNITS.find((u) => u.id === unit)!.mm;
/** „4 dm 5 cm“ → 450 (mm) */
function toMm(s: string): number {
  const parts = s.trim().split(/\s+/);
  let total = 0;
  for (let i = 0; i < parts.length; i += 2) total += Number(parts[i]) * mmOf(parts[i + 1]);
  return total;
}

function checkCommon(p: Problem) {
  expect(p.steps.length).toBeGreaterThan(0);
  for (const s of p.steps) {
    expect(s.hint.length).toBeGreaterThan(5);
    expect(s.hint).not.toMatch(/undefined|NaN/);
    const correct = s.choices.filter((c) => c.correct);
    expect(correct).toHaveLength(1);
    expect(new Set(s.choices.map((c) => c.label)).size).toBe(s.choices.length);
    expect(s.choices.length).toBeGreaterThanOrEqual(3);
    if (s.slots.length) {
      expect(s.answer).toHaveLength(s.slots.length);
      expect(correct[0].label).toBe(formatValues(s.slots, s.answer));
      for (const v of s.answer) expect(Number.isInteger(v) && v >= 0).toBe(true);
      for (const c of s.choices) expect(c.label).not.toMatch(/(^|\s)-|NaN|undefined/);
    }
    // ve výrazech se používá typografické minus a znaménka · :
    expect(s.left ?? "").not.toMatch(/[-*/]/);
  }
}

describe("násobení a dělení", () => {
  it.each(["5", "10", "ext"] as const)("úroveň %s", (level) => {
    for (let i = 0; i < N; i++) {
      for (const op of ["mul", "div"] as const) {
        const p = createMulDiv(op, level);
        checkCommon(p);
        const s = p.steps[0];
        expect(jsEval(s.left!)).toBe(s.answer[0]);
        expect(s.answer[0]).toBeLessThanOrEqual(100);
        if (level === "5") expect(s.answer[0]).toBeLessThanOrEqual(op === "mul" ? 25 : 5);
      }
    }
  });
});

describe("sčítání a odčítání", () => {
  it("dvojciferná čísla, výsledek 0–100, přechod podle volby", () => {
    for (let i = 0; i < N; i++) {
      for (const op of ["add", "sub"] as const) {
        for (const cross of [true, false]) {
          const p = createAddSub(op, cross);
          checkCommon(p);
          const s = p.steps[0];
          const [a, b] = s.left!.split(/ [+−] /).map(Number);
          expect(a).toBeGreaterThanOrEqual(10);
          expect(b).toBeGreaterThanOrEqual(10);
          expect(a).toBeLessThan(100);
          expect(b).toBeLessThan(100);
          expect(jsEval(s.left!)).toBe(s.answer[0]);
          expect(s.answer[0]).toBeGreaterThan(0);
          expect(s.answer[0]).toBeLessThanOrEqual(100);
          const crosses = op === "add" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
          expect(crosses).toBe(cross);
        }
      }
    }
  });
});

describe("přednost operací", () => {
  it.each([true, false])("závorky: %s", (withParens) => {
    for (let i = 0; i < N; i++) {
      const p = createOrder(withParens);
      checkCommon(p);
      const s = p.steps[0];
      // zobrazený výraz spočítaný podle pravidel JS musí dát stejný výsledek
      expect(jsEval(s.left!)).toBe(s.answer[0]);
      expect(s.left!.includes("(")).toBe(withParens);
      expect(s.answer[0]).toBeLessThanOrEqual(100);
    }
  });

  it("vyhodnocení krok za krokem", () => {
    const e = { op: ":" as const, l: { op: "+" as const, l: 45, r: 9, paren: true }, r: { op: "−" as const, l: 12, r: 6, paren: true } };
    expect(format(e)).toBe("(45 + 9) : (12 − 6)");
    expect(evaluate(e)?.chain).toBe("(45 + 9) : (12 − 6) = 54 : (12 − 6) = 54 : 6 = 9");
    const f = { op: "+" as const, l: 75, r: { op: ":" as const, l: 56, r: 8 } };
    expect(evaluate(f)?.steps).toEqual(["56 : 8 = 7", "75 + 7 = 82"]);
    expect(leftToRight(f)).toBeNull(); // 131 : 8 není beze zbytku
    expect(evaluate({ op: ":", l: 7, r: 2 })).toBeNull();
    expect(evaluate({ op: "−", l: 3, r: 5 })).toBeNull();
  });
});

describe("jednotky délky", () => {
  it.each([
    ["simple", true], ["simple", false], ["compound", true], ["compound", false],
  ] as const)("%s, sousední: %s", (kind, neighbors) => {
    for (let i = 0; i < N; i++) {
      const p = createUnits(kind, neighbors);
      checkCommon(p);
      const s = p.steps[0];
      const right = formatValues(s.slots, s.answer);
      expect(toMm(s.left!)).toBe(toMm(right));
      for (const v of [...s.left!.matchAll(/\d+/g)].map((m) => Number(m[0]))) expect(v).toBeLessThanOrEqual(1000);
      // v jednotlivých políčkách složeného převodu je menší jednotka < 1 větší jednotky
      if (s.slots.length === 2) expect(s.answer[1] * mmOf(s.slots[1].suffix!)).toBeLessThan(mmOf(s.slots[0].suffix!));
      if (neighbors) {
        const units = [...(s.left! + " " + right).matchAll(/[a-z]+/g)].map((m) => mmOf(m[0]));
        expect(Math.max(...units) / Math.min(...units)).toBe(10);
      }
    }
  });
});

describe("slovní úlohy", () => {
  it.each([["one"], ["two"]] as const)("druh %s", (kind) => {
    for (let i = 0; i < N; i++) {
      const p = createWord([kind]);
      checkCommon(p);
      const [s1, s2, s3] = p.steps;
      expect(p.steps).toHaveLength(3);
      expect(s1.choices.find((c) => c.correct)!.label).toBe(s2.left);
      expect(jsEval(s2.left!)).toBe(s2.answer[0]);
      expect(s2.answer[0]).toBeGreaterThan(0);
      const ans = s3.choices.find((c) => c.correct)!.label;
      expect(ans).toContain(String(s2.answer[0]));
      expect(p.story).not.toMatch(/undefined|NaN| {2}/);
      // každý chybný zápis musí dávat jiný výsledek než správný
      for (const c of s1.choices.filter((c) => !c.correct)) {
        expect(jsEval(c.label)).not.toBe(s2.answer[0]);
      }
    }
  });
});

describe("registr témat", () => {
  it.each(TOPICS.map((t) => [t.id, t] as const))("%s vytvoří celý test", (_, t) => {
    for (const size of [10, 20]) {
      const test = t.create(t.defaults, size);
      expect(test).toHaveLength(size);
      expect(new Set(test.map((p) => p.key)).size).toBe(size);
    }
  });

  it("čeština podle čísla", () => {
    expect([1, 2, 4, 5, 0, 12].map((n) => plural(n, "a", "b", "c")).join("")).toBe("abbccc");
  });
});

describe("pestrost příkladů", () => {
  const topic = (id: string) => TOPICS.find((t) => t.id === id)!;

  it("slovní úlohy: v testu se neopakuje typ příběhu", () => {
    for (let i = 0; i < 200; i++) {
      const test = topic("word").create({ kinds: ["both"] }, 10);
      expect(new Set(test.map((p) => p.family)).size).toBe(10);
    }
  });

  it("násobilka: řady rovnoměrně, triviální · 1 a · 10 jen výjimečně", () => {
    let trivial = 0;
    for (let i = 0; i < 200; i++) {
      const test = topic("muldiv").create({ ops: ["both"], level: ["10"] }, 10);
      const perFamily = new Map<string, number>();
      for (const p of test) perFamily.set(p.family!, (perFamily.get(p.family!) ?? 0) + 1);
      expect(Math.max(...perFamily.values())).toBeLessThanOrEqual(2);
      trivial += test.filter((p) => /(^|\D)(1|10)( |$)/.test(p.steps[0].left!.split(/ [·:] /)[1]) || / 1$| 10$/.test(p.steps[0].left!)).length;
    }
    expect(trivial / 2000).toBeLessThan(0.15);
  });

  it("paměť nedávných testů: další test je jiný", () => {
    for (const id of ["muldiv", "addsub", "order", "units", "word"]) {
      const t = topic(id);
      const first = t.create(t.defaults, 10);
      const second = t.create(t.defaults, 10, new Set(first.map((p) => p.key)));
      const repeated = second.filter((p) => first.some((q) => q.key === p.key)).length;
      expect(repeated, id).toBe(0);
    }
  });
});
