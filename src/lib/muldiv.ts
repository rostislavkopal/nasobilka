/* Násobení a dělení: malá násobilka (do 5 / do 10) a rozšířené příklady do 100. */
import { expand } from "./expand";
import { type Problem, type Settings, type VarietyOptions, numericStep, pick, randInt, uniqueSet, uuid } from "./core";

export type MulDivOp = "mul" | "div";
export type MulDivLevel = "5" | "10" | "ext";

/** Činitelé a, b pro zvolenou úroveň. */
/** Činitel do `max`; jednička a desítka (triviální příklady) padají jen výjimečně. */
function factor(max: number): number {
  if (Math.random() < 0.1) return max === 10 ? pick([1, 10]) : 1;
  return randInt(2, Math.min(max, 9));
}

function factors(level: MulDivLevel): [number, number] {
  if (level === "5") return [factor(5), factor(5)];
  if (level === "10") return [factor(10), factor(10)];
  // rozšířené: celé desítky (20 · 4) nebo dvojciferné · jednociferné, součin ≤ 100
  for (;;) {
    const b = randInt(2, 9);
    const a = Math.random() < 0.35 ? randInt(1, 9) * 10 : randInt(11, 33);
    if (a * b <= 100 && a !== 10) return [a, b];
  }
}

function mulHint(a: number, b: number): string[] {
  if (a <= 10) return [`${b} · ${a} = ${a * b}`];
  if (a % 10 === 0) return [`${a / 10} · ${b} = ${(a / 10) * b}`, `${a} · ${b} je 10× víc: ${a * b}`];
  const t = a - (a % 10);
  const o = a % 10;
  return [`Rozlož si ${a} = ${t} + ${o}`, `${t} · ${b} = ${t * b}`, `${o} · ${b} = ${o * b}`, `${t * b} + ${o * b} = ${a * b}`];
}

function divHint(a: number, b: number): string[] {
  const n = a * b;
  const check = `Zkouška: ${a} · ${b} = ${n}`;
  if (a <= 10 || a % 10 === 0) return [check];
  const t = a - (a % 10);
  const o = a % 10;
  return [`Rozlož si ${n} = ${t * b} + ${o * b}`, `${t * b} : ${b} = ${t}`, `${o * b} : ${b} = ${o}`, `${t} + ${o} = ${a}`, check];
}

export function createMulDiv(op: MulDivOp, level: MulDivLevel): Problem {
  const [a, b] = factors(level);
  const ans = a * b;
  if (op === "mul") {
    const left = `${a} · ${b}`;
    return {
      id: uuid(),
      key: `mul:${a}:${b}`,
      topic: "muldiv",
      tag: "Násobení",
      steps: [
        numericStep(
          left,
          ans,
          // sousední násobky, sčítání místo násobení, ±1, ±2, ±10
          [(a + 1) * b, (a - 1) * b, a * (b + 1), a * (b - 1), a + b, ans + 10, ans - 10,
            ans + 1, ans - 1, ans + 2, ans - 2, (a + 1) * (b + 1)].filter((n) => n > 0),
          mulHint(a, b),
          a <= 10
            ? `Sečti ${b} celkem ${a}krát.`
            : a % 10 === 0
              ? `Spočítej ${a / 10} · ${b} a přidej k výsledku nulu.`
              : `Rozlož si ${a} = ${a - (a % 10)} + ${a % 10} a vynásob obě části číslem ${b}.`,
        ),
      ],
      summary: `${left} = ${ans}`,
      retry: 0,
      family: `${b}`,
    };
  }
  // dělení: zobrazí se (a·b) : b → výsledek a, vždy beze zbytku
  const left = `${ans} : ${b}`;
  return {
    id: uuid(),
    key: `div:${ans}:${b}`,
    topic: "muldiv",
    tag: "Dělení",
    steps: [
      numericStep(
        left,
        a,
        [a + 1, a - 1, a + 2, a - 2, b, a + 3, a - 3, a * 2, a + 10].filter((n) => n > 0),
        divHint(a, b),
        `Které číslo vynásobené ${b} dá ${ans}? Vzpomeň si na násobky čísla ${b}.`,
      ),
    ],
    summary: `${left} = ${a}`,
    retry: 0,
    family: `${b}`,
  };
}

export function createMulDivTest(s: Settings, size: number, avoid?: ReadonlySet<string>): Problem[] {
  const ops = expand(s, "ops", ["mul", "div"]) as MulDivOp[];
  const level = (s.level?.[0] ?? "10") as MulDivLevel;
  const opts: VarietyOptions = { avoid, families: level === "5" ? 4 : 8 };
  return uniqueSet(() => createMulDiv(pick(ops), level), size, opts);
}
