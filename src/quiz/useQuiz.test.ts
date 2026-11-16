import { describe, expect, it } from "vitest";
import { createMulDiv } from "../lib/muldiv";
import { createUnits } from "../lib/units";
import { createWord } from "../lib/word";
import { type QuizAction, type QuizState, cleanNumber, currentStep, initQuiz, quizReducer } from "./useQuiz";

const run = (s: QuizState, ...actions: QuizAction[]) => actions.reduce(quizReducer, s);
const answerTyped = (s: QuizState, values: number[]) =>
  run(s, ...values.map((v, slot) => ({ type: "type", slot, value: String(v) }) as QuizAction), { type: "submitTyped" });
const correctIndex = (s: QuizState) => currentStep(s)!.choices.findIndex((c) => c.correct);
const wrongIndexes = (s: QuizState) =>
  currentStep(s)!.choices.map((c, i) => (c.correct ? -1 : i)).filter((i) => i >= 0);

describe("quizReducer", () => {
  it("správná odpověď napoprvé prodlouží sérii", () => {
    const problems = [createMulDiv("mul", "10"), createMulDiv("mul", "10")];
    let s = initQuiz(problems, 5);
    s = answerTyped(s, problems[0].steps[0].answer);
    expect(s.feedback?.kind).toBe("correct");
    s = run(s, { type: "type", slot: 0, value: "1" }); // během zpětné vazby se nepíše
    expect(s.typed[0]).toBe(String(problems[0].steps[0].answer[0]));
    s = run(s, { type: "continue" });
    expect(s.index).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.attempts[0].correct).toBe(true);
  });

  it("první chyba = zkus znovu (bez opakování ve frontě), oprava se nepočítá do skóre", () => {
    const problems = Array.from({ length: 6 }, () => createMulDiv("mul", "10"));
    let s = initQuiz(problems, 5);
    const ans = problems[0].steps[0].answer[0];
    s = answerTyped(s, [ans + 1]);
    expect(s.feedback).toEqual({ kind: "retry", given: String(ans + 1) });
    s = run(s, { type: "continue" }); // po první chybě se nepokračuje
    expect(s.index).toBe(0);
    s = answerTyped(s, [ans]);
    expect(s.feedback?.kind).toBe("correct");
    s = run(s, { type: "continue" });
    expect(s.problems).toHaveLength(6);
    expect(s.attempts[0]).toMatchObject({ correct: false, given: String(ans + 1) });
    expect(s.streak).toBe(0);
  });

  it("druhá chyba ukáže řešení a vrátí příklad do fronty", () => {
    const problems = Array.from({ length: 6 }, () => createMulDiv("div", "10"));
    let s = initQuiz(problems, 5);
    const [w1, w2] = wrongIndexes(s);
    s = run(s, { type: "pick", choice: w1 });
    expect(s.feedback?.kind).toBe("retry");
    s = run(s, { type: "pick", choice: w1 }); // stejný špatný návrh znovu nejde
    expect(s.misses).toBe(1);
    s = run(s, { type: "pick", choice: w2 });
    expect(s.feedback?.kind).toBe("reveal");
    s = run(s, { type: "continue" });
    expect(s.problems).toHaveLength(7);
    expect(s.problems[4]).toMatchObject({ key: problems[0].key, retry: 1 });
  });

  it("každých n správných v řadě = hvězdička; test skončí", () => {
    const problems = Array.from({ length: 4 }, () => createMulDiv("mul", "5"));
    let s = initQuiz(problems, 2);
    for (let i = 0; i < 4; i++) s = run(s, { type: "pick", choice: correctIndex(s) }, { type: "continue" });
    expect(s.stars).toBe(2);
    expect(s.finished).toBe(true);
  });

  it("složený převod se odešle, až jsou vyplněná obě políčka", () => {
    let p = createUnits("compound", true);
    while (p.steps[0].slots.length !== 2) p = createUnits("compound", true);
    let s = initQuiz([p], 5);
    s = run(s, { type: "type", slot: 0, value: String(p.steps[0].answer[0]) }, { type: "submitTyped" });
    expect(s.feedback).toBeNull();
    s = answerTyped(s, p.steps[0].answer);
    expect(s.feedback?.kind).toBe("correct");
  });

  it("slovní úloha: tři kroky, chyba v kroku = chybná úloha", () => {
    const p = createWord(["one"]);
    let s = initQuiz([p], 2);
    s = run(s, { type: "pick", choice: correctIndex(s) }, { type: "continue" });
    expect(s.step).toBe(1);
    const [w1, w2] = wrongIndexes(s);
    s = run(s, { type: "pick", choice: w1 }, { type: "pick", choice: w2 }, { type: "continue" });
    expect(s.step).toBe(2);
    expect(s.stepOk).toEqual([true, false]);
    s = run(s, { type: "pick", choice: correctIndex(s) }, { type: "continue" });
    expect(s.attempts[0].correct).toBe(false);
    expect(s.problems[1].retry).toBe(1);
  });

  it("čištění vstupu", () => {
    expect(cleanNumber("0045a")).toBe("45");
    expect(cleanNumber("0")).toBe("0");
    expect(cleanNumber("123456")).toBe("1234");
  });
});
