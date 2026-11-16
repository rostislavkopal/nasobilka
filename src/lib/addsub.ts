/* Pamětné sčítání a odčítání dvojciferných čísel do 100 (bez/s přechodem desítky). */
import { expand } from "./expand";
import { MINUS, type Problem, type Settings, numericStep, pick, randInt, retryUntil, uniqueSet, uuid } from "./core";

export type AddSubOp = "add" | "sub";
export type Crossing = "without" | "with" | "mixed";

const ones = (n: number) => n % 10;
const tens = (n: number) => n - (n % 10);

/** Dvojice dvojciferných čísel; součet ≤ 100, rozdíl ≥ 1, druhé číslo není celá desítka. */
function operands(op: AddSubOp, cross: boolean): [number, number] {
  return retryUntil(() => {
    if (op === "add") {
      const a = randInt(11, 89);
      const b = randInt(11, 89);
      if (a + b > 100 || ones(b) === 0) return null;
      const crosses = ones(a) + ones(b) >= 10;
      return crosses === cross ? [a, b] : null;
    }
    const a = randInt(21, 99);
    const b = randInt(11, a - 1);
    if (ones(b) === 0) return null;
    const crosses = ones(a) < ones(b);
    return crosses === cross ? [a, b] : null;
  });
}

export function createAddSub(op: AddSubOp, cross: boolean): Problem {
  const [a, b] = operands(op, cross);
  const tb = tens(b);
  const ob = ones(b);
  const tag = cross ? "S přechodem desítky" : "Bez přechodu desítky";

  if (op === "add") {
    const ans = a + b;
    const left = `${a} + ${b}`;
    return {
      id: uuid(),
      key: `add:${a}:${b}`,
      topic: "addsub",
      tag,
      steps: [
        numericStep(
          left,
          ans,
          // zapomenutý přechod (−10), záměna, ±1, ±10, sčítání jen desítek
          [ans - 10, ans + 10, ans + 1, ans - 1, a + tb, ans + 2, ans - 2, tens(a) + tb + ones(ones(a) + ob)],
          [`Přičti nejdřív desítky, pak jednotky:`, `${a} + ${tb} = ${a + tb}`, `${a + tb} + ${ob} = ${ans}`],
          `Nejdřív desítky: ${a} + ${tb} = ${a + tb}. Potom jednotky: ${a + tb} + ${ob} = ?`,
        ),
      ],
      summary: `${left} = ${ans}`,
      retry: 0,
      family: `+${tens(a)}`,
    };
  }

  const ans = a - b;
  const left = `${a} ${MINUS} ${b}`;
  // typická chyba: odečtení menší jednotky od větší (83 − 45 → 42)
  const digitError = tens(a) - tb + Math.abs(ones(a) - ob);
  return {
    id: uuid(),
    key: `sub:${a}:${b}`,
    topic: "addsub",
    tag,
    steps: [
      numericStep(
        left,
        ans,
        [ans + 10, ans - 10, ans + 1, ans - 1, digitError, ans + 2, ans - 2, a - tb],
        [`Odečti nejdřív desítky, pak jednotky:`, `${a} ${MINUS} ${tb} = ${a - tb}`, `${a - tb} ${MINUS} ${ob} = ${ans}`],
        `Nejdřív desítky: ${a} ${MINUS} ${tb} = ${a - tb}. Potom jednotky: ${a - tb} ${MINUS} ${ob} = ?`,
      ),
    ],
    summary: `${left} = ${ans}`,
    retry: 0,
    family: `-${tens(a)}`,
  };
}

export function createAddSubTest(s: Settings, size: number, avoid?: ReadonlySet<string>): Problem[] {
  const ops = expand(s, "ops", ["add", "sub"]) as AddSubOp[];
  const crossing = (s.crossing?.[0] ?? "mixed") as Crossing;
  return uniqueSet(
    () => createAddSub(pick(ops), crossing === "mixed" ? Math.random() < 0.6 : crossing === "with"),
    size,
    { avoid, families: ops.length * 7 },
  );
}
