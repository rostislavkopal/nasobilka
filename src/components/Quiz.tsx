import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, Lightbulb, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import type { Mode, Step } from "../lib/core";
import type { Topic } from "../lib/topics";
import { type QuizAction, type QuizState, currentStep } from "../quiz/useQuiz";
import { BackLink, Panel, StarRow, TOPIC_STYLE, cx } from "./ui";

const PRAISE = ["Skvěle!", "Výborně!", "Správně!", "Paráda!", "Super, jen tak dál!", "Přesně tak!"];

export function Quiz({
  topic,
  state,
  dispatch,
  mode,
  onSettings,
  onHome,
}: {
  topic: Topic;
  state: QuizState;
  dispatch: (a: QuizAction) => void;
  mode: Mode;
  onSettings: () => void;
  onHome: () => void;
}) {
  const problem = state.problems[state.index];
  const step = currentStep(state);
  if (!problem || !step) return null;

  // slovní úlohy: výpočet se vždy píše; zápis a odpověď se vybírají
  const typing = !!step.slots.length && (topic.fixedMode || mode === "typing");
  const per = state.streakForStar;

  // hvězdičky se plní hned po správné odpovědi (série se v reduceru zapíše až při přechodu dál)
  const lastStep = state.step === problem.steps.length - 1;
  const live = state.streak + (state.feedback?.kind === "correct" && lastStep && !state.problemWrong ? 1 : 0);
  const filled = live > 0 && live % per === 0 ? per : live % per;
  const earned = state.stars + (filled === per && live > state.streak ? 1 : 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <BackLink onClick={onHome} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold text-muted-foreground">
          {topic.id === "word" ? "Úloha" : "Příklad"} {Math.min(state.index + 1, state.problems.length)} z {state.problems.length}
        </span>
        <div className="flex items-center gap-3">
          {earned > 0 && (
            <span key={earned} className="anim-pop inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-sm font-extrabold text-warning">
              <Trophy className="size-4" /> {earned}
            </span>
          )}
          <StarRow filled={filled} total={per} label={`Série ${filled} z ${per} správných odpovědí v řadě`} />
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-500 [background:var(--gradient)] shadow-[0_0_12px_var(--g-magenta)]"
          style={{ width: `${(state.attempts.length / state.problems.length) * 100}%` }}
        />
      </div>

      <Panel className="mt-5 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
            {topic.title}
            {problem.retry > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
                <RotateCcw className="size-3.5" /> Oprava
              </span>
            )}
          </h1>
          <button onClick={onSettings} className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/80 hover:text-foreground">
            <RotateCcw className="size-4" /> Změnit nastavení
          </button>
        </div>

        {problem.story && (
          <>
            <p className={cx("mt-5 rounded-2xl px-5 py-4 text-lg font-bold leading-relaxed ring-1 ring-white/10", TOPIC_STYLE[topic.id].soft)}>
              {problem.story}
            </p>
            <Stepper steps={problem.steps} current={state.step} ok={state.stepOk} />
          </>
        )}

        <StepView
          key={`${problem.id}-${state.step}`}
          step={step}
          state={state}
          typing={typing}
          isWord={!!problem.story}
          dispatch={dispatch}
        />
      </Panel>

      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 text-warning" /> Není to závod. Důležité je nevzdat se.
      </p>
    </div>
  );
}

/* ───────────────────────── jeden krok ───────────────────────── */

function StepView({
  step,
  state,
  typing,
  isWord,
  dispatch,
}: {
  step: Step;
  state: QuizState;
  typing: boolean;
  isWord: boolean;
  dispatch: (a: QuizAction) => void;
}) {
  const [showHint, setShowHint] = useState(false);
  const fb = state.feedback;
  const locked = fb?.kind === "correct" || fb?.kind === "reveal";

  return (
    <div className="anim-rise">
      {step.left !== undefined ? (
        <Equation step={step} revealed={locked} shake={fb?.kind === "retry" || fb?.kind === "reveal"} pop={fb?.kind === "correct"} />
      ) : (
        <h2 className="mb-4 mt-6 text-lg font-extrabold">{step.prompt}</h2>
      )}

      {typing ? (
        <TypedAnswer step={step} state={state} locked={locked} dispatch={dispatch} />
      ) : (
        <ChoiceAnswers step={step} state={state} locked={locked} onPick={(i) => dispatch({ type: "pick", choice: i })} />
      )}

      <FeedbackBox step={step} state={state} isWord={isWord} onContinue={() => dispatch({ type: "continue" })} />

      {!fb && showHint && (
        <div className="anim-rise mt-4 flex gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-sm font-semibold">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" /> {step.hint}
        </div>
      )}
      {!locked && fb?.kind !== "retry" && (
        <button
          onClick={() => setShowHint((v) => !v)}
          className="mx-auto mt-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="size-4 text-warning" /> {showHint ? "Schovat nápovědu" : "Potřebuji nápovědu"}
        </button>
      )}
    </div>
  );
}

function Stepper({ steps, current, ok }: { steps: Step[]; current: number; ok: boolean[] }) {
  return (
    <div className="mt-5">
      <ol className="flex items-center gap-1.5 text-sm font-bold sm:gap-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-1.5 sm:gap-2">
            {i > 0 && <ArrowRight className="size-3.5 shrink-0 text-muted-foreground sm:size-4" />}
            <span
              className={cx(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                i === current && "text-white [background:var(--gradient)]",
                i > current && "bg-muted text-muted-foreground",
                i < current && (ok[i] ? "bg-success-soft text-success" : "bg-danger-soft text-danger"),
              )}
            >
              {i < current ? ok[i] ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={i === current ? "text-foreground" : "text-muted-foreground"}>{s.title}</span>
          </li>
        ))}
      </ol>
      {current > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {steps.slice(0, current).map((s, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-muted-foreground">{s.title}: </span>
              <span className="font-extrabold">{s.done}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** „5 · 9 = ?“, „45 cm = ? dm ? cm“ – po vyřešení se otazníky nahradí výsledkem. */
function Equation({ step, revealed, shake, pop }: { step: Step; revealed: boolean; shake: boolean; pop: boolean }) {
  const len = (step.left ?? "").length + step.slots.length * 5;
  return (
    <div
      className={cx(
        "nums my-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center font-extrabold",
        len <= 18 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
        pop && "anim-pop",
        shake && "anim-shake",
      )}
    >
      <span>{step.left}</span>
      <span>=</span>
      {step.slots.map((s, i) => (
        <span key={i} className="whitespace-nowrap">
          <span className={revealed ? "text-success" : "text-gradient"}>{revealed ? step.answer[i] : "?"}</span>
          {s.suffix && <span> {s.suffix}</span>}
        </span>
      ))}
    </div>
  );
}

function TypedAnswer({
  step,
  state,
  locked,
  dispatch,
}: {
  step: Step;
  state: QuizState;
  locked: boolean;
  dispatch: (a: QuizAction) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const retry = state.feedback?.kind === "retry";
  const complete = state.typed.every((t) => t !== "");

  // po načtení kroku kurzor do prvního políčka, po chybě označit odpověď k přepsání
  useEffect(() => {
    refs.current[0]?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (retry) refs.current[0]?.select();
  }, [retry, state.misses]);

  const submit = () => {
    const empty = state.typed.findIndex((t) => t === "");
    if (empty !== -1) refs.current[empty]?.focus();
    else dispatch({ type: "submitTyped" });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        {step.slots.map((s, i) => (
          <label key={i} className="flex items-center gap-2 text-2xl font-extrabold">
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              aria-label={s.suffix ? `Počet ${s.suffix}` : "Výsledek"}
              value={state.typed[i] ?? ""}
              readOnly={locked}
              onChange={(e) => dispatch({ type: "type", slot: i, value: e.target.value })}
              className={cx(
                "nums h-16 w-24 rounded-2xl border-2 bg-muted text-center text-3xl font-extrabold outline-none transition sm:w-28",
                "text-foreground focus:border-brand focus:bg-white/10 focus:ring-4 focus:ring-brand/25",
                retry ? "border-danger/50" : state.feedback?.kind === "correct" ? "border-success bg-success-soft" : "border-border",
              )}
            />
            {s.suffix && <span className="text-muted-foreground">{s.suffix}</span>}
          </label>
        ))}
      </div>
      {!locked && (
        <button
          type="submit"
          disabled={!complete}
          className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold"
        >
          <Check className="size-5" strokeWidth={3} /> Zkontrolovat
        </button>
      )}
    </form>
  );
}

function ChoiceAnswers({
  step,
  state,
  locked,
  onPick,
}: {
  step: Step;
  state: QuizState;
  locked: boolean;
  onPick: (i: number) => void;
}) {
  const long = step.choices.some((c) => c.label.length > 16);
  return (
    <div className={cx("grid gap-3", long ? "grid-cols-1" : "grid-cols-2")}>
      {step.choices.map((c, i) => {
        const tried = state.wrongPicks.includes(i);
        const showCorrect = locked && c.correct;
        return (
          <button
            key={c.label}
            onClick={() => onPick(i)}
            disabled={locked || tried}
            className={cx(
              "nums min-h-14 rounded-2xl border-2 px-4 py-3 font-extrabold transition",
              long ? "text-left text-lg" : "text-xl sm:text-2xl",
              showCorrect && "border-success bg-success-soft text-success",
              tried && "border-danger/30 bg-danger-soft text-danger line-through decoration-2",
              !showCorrect && !tried && (locked ? "border-transparent bg-muted opacity-50" : "border-transparent bg-muted hover:border-brand/40 hover:bg-brand-soft active:scale-[0.98]"),
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function FeedbackBox({
  step,
  state,
  isWord,
  onContinue,
}: {
  step: Step;
  state: QuizState;
  isWord: boolean;
  onContinue: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const fb = state.feedback;
  useEffect(() => {
    if (fb?.kind === "reveal") btn.current?.focus();
  }, [fb]);
  if (!fb) return null;

  if (fb.kind === "correct") {
    return (
      <div role="status" className="anim-pop mt-5 flex flex-wrap items-center gap-2.5 rounded-xl bg-success-soft px-4 py-3.5 font-extrabold text-success">
        <CircleCheck className="size-5" /> {PRAISE[(state.index + state.step) % PRAISE.length]}
        {state.misses > 0 && <span className="font-semibold text-foreground/70">Napodruhé to vyšlo.</span>}
      </div>
    );
  }
  if (fb.kind === "retry") {
    return (
      <div role="alert" className="anim-rise mt-5 rounded-xl bg-danger-soft px-4 py-3.5">
        <p className="flex items-center gap-2 font-extrabold text-danger">
          <X className="size-5" strokeWidth={3} /> Ještě to není ono. Zkus to znovu!
        </p>
        <p className="mt-1 pl-7 text-sm font-semibold text-danger/90">{step.hint}</p>
      </div>
    );
  }
  const correct = step.choices.find((c) => c.correct)?.label ?? "";
  return (
    <div role="alert" className="anim-rise mt-5 rounded-xl bg-danger-soft px-4 py-4">
      <p className="flex flex-wrap items-center gap-2 font-extrabold text-danger">
        <X className="size-5" strokeWidth={3} /> Tentokrát to nevyšlo. Správně je: <span className="text-success">{correct}</span>
      </p>
      {step.explain.length > 0 && (
        <div className="mt-3 rounded-xl bg-black/25 px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-extrabold">
            <Lightbulb className="size-4 text-warning" /> Jak na to
          </p>
          <ul className="nums flex flex-col gap-0.5 font-bold">
            {step.explain.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{isWord ? "Úloha" : "Příklad"} se ti za chvíli vrátí, ať si ho zopakuješ.</span>
        <button
          ref={btn}
          onClick={onContinue}
          className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-extrabold"
        >
          Pokračovat <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
