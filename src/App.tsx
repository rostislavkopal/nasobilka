import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Attempt,
  type Mode,
  type Operation,
  type Problem,
  QUESTIONS_PER_TEST,
  createTest,
  formatProblem,
  opSymbol,
  repeatWrong,
} from "./lib/nasobilka";

type Phase = "setup" | "quiz" | "results";
type Feedback = { given: number | null; correct: boolean } | null;

const FEEDBACK_OK_MS = 650;
const FEEDBACK_ERR_MS = 1400;
const MAX_DIGITS = 3;

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export default function App() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("choice");
  const [operations, setOperations] = useState<Operation[]>(["mul", "div"]);
  const [maxFactor, setMaxFactor] = useState(10);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [round, setRound] = useState(0);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timer = useRef<number | undefined>(undefined);

  const clearTimer = () => window.clearTimeout(timer.current);
  useEffect(() => clearTimer, []);

  const begin = (list: Problem[], nextRound: number) => {
    clearTimer();
    setProblems(list);
    setIndex(0);
    setAttempts([]);
    setRound(nextRound);
    setTyped("");
    setFeedback(null);
    setPhase("quiz");
  };

  const startTest = () => begin(createTest({ operations, maxFactor }), 0);
  const startRepeat = () => begin(repeatWrong(attempts), round + 1);
  const onHome = () => {
    clearTimer();
    setFeedback(null);
    setPhase("setup");
  };

  const problem = problems[index];

  const submit = useCallback(
    (value: number | null) => {
      if (feedback !== null || !problem) return;
      const correct = value === problem.answer;
      setAttempts((prev) => [...prev, { problem, given: value, correct }]);
      setFeedback({ given: value, correct });
      timer.current = window.setTimeout(
        () => {
          setFeedback(null);
          setTyped("");
          if (index + 1 >= problems.length) setPhase("results");
          else setIndex(index + 1);
        },
        correct ? FEEDBACK_OK_MS : FEEDBACK_ERR_MS,
      );
    },
    [feedback, problem, index, problems.length],
  );

  const typeDigit = useCallback(
    (d: string) => {
      if (feedback) return;
      setTyped((t) => (t.length >= MAX_DIGITS ? t : t === "0" ? d : t + d));
    },
    [feedback],
  );
  const backspace = useCallback(() => {
    if (!feedback) setTyped((t) => t.slice(0, -1));
  }, [feedback]);
  const confirmTyped = useCallback(() => {
    if (typed !== "") submit(Number(typed));
  }, [typed, submit]);

  useEffect(() => {
    if (phase !== "quiz" || mode !== "typing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Enter") confirmTyped();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, mode, typeDigit, backspace, confirmTyped]);

  const correctCount = attempts.filter((a) => a.correct).length;
  const wrong = attempts.filter((a) => !a.correct);

  return (
    <div className="min-h-screen">
      <Header
        round={round}
        score={phase === "setup" ? null : { correct: correctCount, total: attempts.length }}
        onHome={phase === "setup" ? undefined : onHome}
      />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {phase === "setup" && (
          <Setup
            mode={mode}
            setMode={setMode}
            operations={operations}
            setOperations={setOperations}
            maxFactor={maxFactor}
            setMaxFactor={setMaxFactor}
            onStart={startTest}
          />
        )}

        {phase === "quiz" && problem && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
            <aside className="order-2 flex flex-col gap-6 lg:order-1">
              <Progress
                current={index + 1}
                total={problems.length}
                answered={attempts.length}
                correct={correctCount}
                wrong={wrong.length}
              />
              <Card>
                <ModePicker mode={mode} setMode={(m) => { setMode(m); setTyped(""); }} compact />
                <button
                  onClick={onHome}
                  className="mt-4 w-full rounded-btn border-2 border-border bg-card py-3 font-semibold transition hover:border-foreground"
                >
                  Ukončit test
                </button>
              </Card>
            </aside>

            <section className="order-1 flex flex-col gap-6 lg:order-2">
              <Card className="p-6 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="label-caps">Příklad {index + 1}</span>
                  <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
                    {problem.op === "mul" ? "Násobení" : "Dělení"}
                  </span>
                </div>

                <ProblemDisplay key={problem.id} problem={problem} feedback={feedback} typed={mode === "typing" ? typed : null} />

                {mode === "choice" ? (
                  <ChoiceAnswers problem={problem} feedback={feedback} onPick={submit} />
                ) : (
                  <Keypad
                    feedback={feedback}
                    canConfirm={typed !== ""}
                    onDigit={typeDigit}
                    onBackspace={backspace}
                    onConfirm={confirmTyped}
                  />
                )}
              </Card>

              {wrong.length > 0 && (
                <Card>
                  <div className="label-caps mb-3">Chyby v tomto kole</div>
                  <ul className="flex flex-wrap gap-2">
                    {wrong.map((a) => (
                      <li
                        key={a.problem.id}
                        className="rounded-btn border-2 border-danger/30 bg-danger-soft px-3 py-1.5 font-display font-semibold"
                      >
                        {formatProblem(a.problem)} = <span className="text-success">{a.problem.answer}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </section>
          </div>
        )}

        {phase === "results" && (
          <Results
            attempts={attempts}
            round={round}
            onRepeat={startRepeat}
            onNew={startTest}
            onHome={onHome}
          />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── Layout pieces ───────────────────────── */

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-card border-2 border-foreground bg-card p-6", className)}>{children}</div>
  );
}

function Header({
  round,
  score,
  onHome,
}: {
  round: number;
  score: { correct: number; total: number } | null;
  onHome?: () => void;
}) {
  return (
    <header className="border-b-2 border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button onClick={onHome} disabled={!onHome} className="flex items-center gap-3 text-left">
          <span className="grid size-10 place-items-center rounded-xl bg-brand font-display text-2xl font-bold text-brand-foreground">
            ×
          </span>
          <span>
            <span className="block font-display text-xl font-bold leading-tight">Násobilka</span>
            <span className="block text-sm text-muted-foreground">
              {round > 0 ? `Opakování ${round}` : "Procvičování násobení a dělení"}
            </span>
          </span>
        </button>
        {score && (
          <div className="rounded-full border-2 border-border px-4 py-1.5 font-display text-lg font-bold">
            <span className="text-success">{score.correct}</span>
            <span className="text-muted-foreground"> / {score.total}</span>
          </div>
        )}
      </div>
    </header>
  );
}

/* ───────────────────────── Setup ───────────────────────── */

function ModePicker({
  mode,
  setMode,
  compact,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  compact?: boolean;
}) {
  const items: { id: Mode; letter: string; title: string; sub: string }[] = [
    { id: "choice", letter: "A", title: "Výběr z 5 návrhů", sub: "klikni na správný výsledek" },
    { id: "typing", letter: "B", title: "Psaní na klávesnici", sub: "napiš, smaž a potvrď" },
  ];
  return (
    <div>
      <div className="label-caps mb-3">Režim testu</div>
      <div className="flex flex-col gap-3">
        {items.map((it) => {
          const active = mode === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setMode(it.id)}
              aria-pressed={active}
              className={cx(
                "flex items-center gap-4 rounded-btn border-2 px-4 text-left transition",
                compact ? "py-3" : "py-4",
                active
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-card hover:border-brand/50",
              )}
            >
              <span className={cx("font-display text-3xl font-bold", !active && "text-muted-foreground")}>
                {it.letter}
              </span>
              <span>
                <span className={cx("block font-semibold", !active && "text-muted-foreground")}>{it.title}</span>
                <span className={cx("block text-sm", active ? "text-brand-foreground/85" : "text-muted-foreground")}>
                  {it.sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-btn border-2 px-5 py-4 font-display text-lg font-bold transition",
        active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-card text-muted-foreground hover:border-brand/50",
      )}
    >
      {children}
    </button>
  );
}

function Setup(props: {
  mode: Mode;
  setMode: (m: Mode) => void;
  operations: Operation[];
  setOperations: (o: Operation[]) => void;
  maxFactor: number;
  setMaxFactor: (n: number) => void;
  onStart: () => void;
}) {
  const { operations, setOperations } = props;
  const toggleOp = (op: Operation) => {
    const has = operations.includes(op);
    if (has && operations.length === 1) return; // alespoň jedna volba
    setOperations(has ? operations.filter((o) => o !== op) : [...operations, op]);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-6 sm:p-8">
        <ModePicker mode={props.mode} setMode={props.setMode} />

        <div className="label-caps mb-3 mt-7">Počítáme</div>
        <div className="flex flex-wrap gap-3">
          <Chip active={operations.includes("mul")} onClick={() => toggleOp("mul")}>Násobení ×</Chip>
          <Chip active={operations.includes("div")} onClick={() => toggleOp("div")}>Dělení ÷</Chip>
        </div>

        <div className="label-caps mb-3 mt-7">Rozsah</div>
        <div className="flex flex-wrap gap-3">
          <Chip active={props.maxFactor === 5} onClick={() => props.setMaxFactor(5)}>do 5</Chip>
          <Chip active={props.maxFactor === 10} onClick={() => props.setMaxFactor(10)}>do 10</Chip>
        </div>

        <button
          onClick={props.onStart}
          className="mt-9 w-full rounded-btn bg-brand py-5 font-display text-2xl font-bold text-brand-foreground transition hover:brightness-110 active:scale-[0.99]"
        >
          Spustit test ({QUESTIONS_PER_TEST} příkladů)
        </button>
      </Card>
    </div>
  );
}

/* ───────────────────────── Quiz ───────────────────────── */

function Progress(p: { current: number; total: number; answered: number; correct: number; wrong: number }) {
  const pct = (p.answered / p.total) * 100;
  return (
    <Card>
      <div className="label-caps">Postup</div>
      <div className="mt-2 font-display">
        <span className="text-6xl font-bold">{p.current}</span>
        <span className="text-3xl text-muted-foreground"> / {p.total}</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Stat value={p.correct} label="správně" className="border-success/40 bg-success-soft text-success" />
        <Stat value={p.wrong} label="chyby" className="border-danger/40 bg-danger-soft text-danger" />
        <Stat value={p.total - p.answered} label="zbývá" className="border-border bg-muted text-muted-foreground" />
      </div>
    </Card>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={cx("rounded-btn border py-3", className)}>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-sm font-semibold text-foreground">{label}</div>
    </div>
  );
}

function ProblemDisplay({
  problem,
  feedback,
  typed,
}: {
  problem: Problem;
  feedback: Feedback;
  typed: string | null;
}) {
  let result: React.ReactNode = <span className="text-muted-foreground/60">?</span>;
  if (feedback) {
    result = <span className="text-success">{problem.answer}</span>;
  } else if (typed !== null && typed !== "") {
    result = <span className="text-brand">{typed}</span>;
  }

  return (
    <div
      className={cx(
        "my-8 flex flex-wrap items-baseline justify-center gap-x-4 font-display text-6xl font-bold sm:text-8xl",
        feedback?.correct && "anim-pop",
        feedback && !feedback.correct && "anim-shake",
      )}
    >
      <span>{problem.left}</span>
      <span className="text-brand">{opSymbol(problem.op)}</span>
      <span>{problem.right}</span>
      <span className="text-muted-foreground/60">=</span>
      <span className="min-w-[1.2ch] text-center">{result}</span>
      {feedback && !feedback.correct && (
        <div className="basis-full pt-3 text-center font-body text-lg font-semibold text-danger sm:text-xl">
          {feedback.given === null ? "Bez odpovědi" : `Tvoje odpověď: ${feedback.given}`} ✗
        </div>
      )}
    </div>
  );
}

function ChoiceAnswers({
  problem,
  feedback,
  onPick,
}: {
  problem: Problem;
  feedback: Feedback;
  onPick: (n: number) => void;
}) {
  return (
    <>
      <div className="label-caps mb-4 text-center">Vyber správný výsledek</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {problem.options.map((n) => {
          const isAnswer = n === problem.answer;
          const isGiven = feedback?.given === n;
          return (
            <button
              key={n}
              onClick={() => onPick(n)}
              disabled={feedback !== null}
              className={cx(
                "min-h-[76px] rounded-btn border-2 font-display text-4xl font-bold transition",
                !feedback && "border-border bg-card hover:border-brand hover:bg-brand-soft active:scale-[0.98]",
                feedback && isAnswer && "border-success bg-success text-success-foreground",
                feedback && isGiven && !isAnswer && "border-danger bg-danger text-danger-foreground",
                feedback && !isAnswer && !isGiven && "border-border bg-card opacity-50",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </>
  );
}

function Keypad({
  feedback,
  canConfirm,
  onDigit,
  onBackspace,
  onConfirm,
}: {
  feedback: Feedback;
  canConfirm: boolean;
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onConfirm: () => void;
}) {
  const key =
    "min-h-[72px] rounded-btn border-2 font-display text-3xl font-bold transition active:scale-[0.97] disabled:opacity-50";
  return (
    <>
      <div className="label-caps mb-4 text-center">Napiš výsledek</div>
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} onClick={() => onDigit(d)} disabled={!!feedback} className={cx(key, "border-border bg-card hover:border-brand")}>
            {d}
          </button>
        ))}
        <button onClick={onBackspace} disabled={!!feedback} aria-label="Smazat" className={cx(key, "border-border bg-muted hover:border-foreground")}>
          ⌫
        </button>
        <button onClick={() => onDigit("0")} disabled={!!feedback} className={cx(key, "border-border bg-card hover:border-brand")}>
          0
        </button>
        <button
          onClick={onConfirm}
          disabled={!!feedback || !canConfirm}
          aria-label="Potvrdit"
          className={cx(key, "border-brand bg-brand text-brand-foreground hover:brightness-110")}
        >
          ✓
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">Můžeš psát i na klávesnici · Enter potvrdí · Backspace smaže</p>
    </>
  );
}

/* ───────────────────────── Results ───────────────────────── */

function Results({
  attempts,
  round,
  onRepeat,
  onNew,
  onHome,
}: {
  attempts: Attempt[];
  round: number;
  onRepeat: () => void;
  onNew: () => void;
  onHome: () => void;
}) {
  const correct = attempts.filter((a) => a.correct).length;
  const wrong = attempts.filter((a) => !a.correct);
  const ratio = attempts.length ? correct / attempts.length : 0;
  const praise =
    ratio === 1 ? "Výborně! Všechno správně! 🎉" : ratio >= 0.8 ? "Skvělá práce! 👏" : ratio >= 0.5 ? "Dobrá práce, ještě trénuj! 💪" : "Nevzdávej to, procvičuj dál! 🙂";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="p-6 text-center sm:p-10">
        <div className="label-caps">{round > 0 ? `Vyhodnocení – opakování ${round}` : "Vyhodnocení"}</div>
        <div className="mt-3 font-display text-7xl font-bold sm:text-8xl">
          {correct} <span className="text-4xl text-muted-foreground sm:text-5xl">z {attempts.length}</span>
        </div>
        <p className="mt-3 text-xl font-semibold">{praise}</p>

        <div className="mx-auto mt-8 grid max-w-md grid-cols-5 gap-2 sm:grid-cols-10">
          {attempts.map((a, i) => (
            <div
              key={a.problem.id}
              title={`${i + 1}. ${formatProblem(a.problem)}`}
              className={cx(
                "grid aspect-square place-items-center rounded-lg font-display text-sm font-bold",
                a.correct ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          {wrong.length > 0 && (
            <button
              onClick={onRepeat}
              className="flex-1 rounded-btn bg-danger py-4 font-display text-xl font-bold text-danger-foreground transition hover:brightness-110"
            >
              Procvičit chyby ({wrong.length})
            </button>
          )}
          <button
            onClick={onNew}
            className="flex-1 rounded-btn bg-brand py-4 font-display text-xl font-bold text-brand-foreground transition hover:brightness-110"
          >
            Nový test
          </button>
          <button
            onClick={onHome}
            className="flex-1 rounded-btn border-2 border-border bg-card py-4 font-display text-xl font-bold transition hover:border-foreground"
          >
            Nastavení
          </button>
        </div>
      </Card>

      {wrong.length > 0 && (
        <Card>
          <div className="label-caps mb-4">Špatně spočítané příklady</div>
          <ul className="divide-y-2 divide-border">
            {wrong.map((a) => (
              <li key={a.problem.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-display text-2xl font-bold">
                  {formatProblem(a.problem)} = <span className="text-success">{a.problem.answer}</span>
                </span>
                <span className="rounded-full bg-danger-soft px-3 py-1 text-sm font-semibold text-danger">
                  tvoje odpověď: {a.given ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
