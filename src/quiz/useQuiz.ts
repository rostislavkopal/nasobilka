/* Stav jednoho testu (useReducer): fronta příkladů, kroky, odpovědi, druhý pokus, série a hvězdičky. */
import { useEffect, useReducer } from "react";
import {
  type Attempt, MAX_DIGITS, type Problem, type Step, checkValues, formatValues, scheduleRetry,
} from "../lib/core";

/**
 * correct – správně (po chvíli se pokračuje samo),
 * retry   – první chyba: „Zkus to znovu“ + nápověda, žák opravuje,
 * reveal  – druhá chyba: ukáže se správné řešení, pokračuje se tlačítkem.
 */
export type Feedback =
  | { kind: "correct" }
  | { kind: "retry"; given: string }
  | { kind: "reveal"; given: string };

export interface QuizState {
  problems: Problem[];
  index: number;
  step: number;
  /** Rozepsané hodnoty políček aktuálního kroku. */
  typed: string[];
  feedback: Feedback | null;
  /** Kolikrát žák v aktuálním kroku chyboval. */
  misses: number;
  /** Návrhy, které už žák v tomto kroku zkusil a byly špatně. */
  wrongPicks: number[];
  /** Žák v aktuálním příkladu chyboval (v kterémkoli kroku) – nepočítá se jako správně napoprvé. */
  problemWrong: boolean;
  /** Ukázalo se správné řešení → příklad se vrátí k opravě. */
  needsRetry: boolean;
  /** Výsledek zodpovězených kroků aktuálního příkladu (true = napoprvé). */
  stepOk: boolean[];
  firstGiven?: string;
  attempts: Attempt[];
  streak: number;
  stars: number;
  streakForStar: number;
  finished: boolean;
}

export type QuizAction =
  | { type: "type"; slot: number; value: string }
  | { type: "submitTyped" }
  | { type: "pick"; choice: number }
  | { type: "continue" };

const emptyTyped = (s: Step | undefined) => (s ? s.slots.map(() => "") : []);

const freshStep = (step: Step | undefined) => ({
  typed: emptyTyped(step),
  feedback: null,
  misses: 0,
  wrongPicks: [] as number[],
});

export function initQuiz(problems: Problem[], streakForStar: number): QuizState {
  return {
    problems,
    index: 0,
    step: 0,
    ...freshStep(problems[0]?.steps[0]),
    problemWrong: false,
    needsRetry: false,
    stepOk: [],
    attempts: [],
    streak: 0,
    stars: 0,
    streakForStar,
    finished: problems.length === 0,
  };
}

export const currentStep = (s: QuizState): Step | undefined => s.problems[s.index]?.steps[s.step];

/** Jen číslice, bez úvodních nul, max. MAX_DIGITS znaků. */
export const cleanNumber = (v: string) => v.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);

function answer(s: QuizState, correct: boolean, given: string, picked?: number): QuizState {
  if (correct) {
    return { ...s, feedback: { kind: "correct" }, stepOk: [...s.stepOk, s.misses === 0] };
  }
  const base = {
    ...s,
    problemWrong: true,
    firstGiven: s.firstGiven ?? given,
    misses: s.misses + 1,
    wrongPicks: picked === undefined ? s.wrongPicks : [...s.wrongPicks, picked],
  };
  if (s.misses === 0) return { ...base, feedback: { kind: "retry", given } };
  return { ...base, feedback: { kind: "reveal", given }, needsRetry: true, stepOk: [...s.stepOk, false] };
}

/** Přechod na další krok, nebo uzavření příkladu a přechod na další příklad. */
function advance(s: QuizState): QuizState {
  const problem = s.problems[s.index];
  if (s.step + 1 < problem.steps.length) {
    const step = s.step + 1;
    return { ...s, step, ...freshStep(problem.steps[step]) };
  }
  const correct = !s.problemWrong;
  const streak = correct ? s.streak + 1 : 0;
  const stars = s.stars + (correct && streak % s.streakForStar === 0 ? 1 : 0);
  // příklad, u kterého se muselo ukázat řešení, se vrátí o pár příkladů později
  const problems = s.needsRetry ? scheduleRetry(s.problems, s.index, problem) : s.problems;
  const index = s.index + 1;
  const finished = index >= problems.length;
  return {
    ...s,
    problems,
    index,
    step: 0,
    ...freshStep(finished ? undefined : problems[index].steps[0]),
    problemWrong: false,
    needsRetry: false,
    stepOk: [],
    firstGiven: undefined,
    attempts: [...s.attempts, { problem, correct, given: s.firstGiven }],
    streak,
    stars,
    finished,
  };
}

export function quizReducer(s: QuizState, a: QuizAction): QuizState {
  const step = currentStep(s);
  if (!step || s.finished) return s;
  const locked = s.feedback?.kind === "correct" || s.feedback?.kind === "reveal";

  if (a.type === "continue") return locked ? advance(s) : s;
  if (locked) return s; // ochrana proti dvojkliku a psaní během zpětné vazby

  switch (a.type) {
    case "type": {
      if (a.slot < 0 || a.slot >= step.slots.length) return s;
      const typed = [...s.typed];
      typed[a.slot] = cleanNumber(a.value);
      return { ...s, typed };
    }
    case "submitTyped": {
      if (!step.slots.length || s.typed.some((t) => t === "")) return s;
      const values = s.typed.map(Number);
      return answer(s, checkValues(step, values), formatValues(step.slots, values));
    }
    case "pick": {
      const c = step.choices[a.choice];
      if (!c || s.wrongPicks.includes(a.choice)) return s;
      return answer(s, c.correct, c.label, a.choice);
    }
  }
}

const OK_MS = 900;

/** Test jako reducer + automatický posun po správné odpovědi. */
export function useQuiz(problems: Problem[], streakForStar: number) {
  const [state, dispatch] = useReducer(quizReducer, undefined, () => initQuiz(problems, streakForStar));
  useEffect(() => {
    if (state.feedback?.kind !== "correct") return;
    const t = window.setTimeout(() => dispatch({ type: "continue" }), OK_MS);
    return () => window.clearTimeout(t);
  }, [state.feedback]);
  return [state, dispatch] as const;
}
