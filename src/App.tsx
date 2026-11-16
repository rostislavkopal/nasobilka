import { useEffect, useRef, useState } from "react";
import type { Mode, Problem, Settings, TopicId } from "./lib/core";
import { type Stats, loadRecent, loadSettings, loadStats, recordTest, rememberRecent, saveSettings } from "./lib/stats";
import { type Topic, STREAK_FOR_STAR, TOPICS, countOf, topicById } from "./lib/topics";
import { useQuiz } from "./quiz/useQuiz";
import { Dashboard } from "./components/Dashboard";
import { Progress } from "./components/Progress";
import { Quiz } from "./components/Quiz";
import { Results } from "./components/Results";
import { Setup } from "./components/Setup";
import { Header } from "./components/ui";

type Screen = "hub" | "progress" | "setup" | "test";

const initialSettings = (): Record<TopicId, Settings> => {
  const saved = loadSettings();
  return Object.fromEntries(
    TOPICS.map((t): [TopicId, Settings] => [t.id, { count: ["10"], ...t.defaults, ...saved[t.id] }]),
  ) as Record<TopicId, Settings>;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("hub");
  const [topicId, setTopicId] = useState<TopicId>("muldiv");
  const [mode, setMode] = useState<Mode>(() => (loadSettings().mode === "choice" ? "choice" : "typing"));
  const [settings, setSettings] = useState(initialSettings);
  const [stats, setStats] = useState<Stats>(loadStats);
  /** Nový test = nový klíč → čerstvý reducer. */
  const [run, setRun] = useState<{ id: number; problems: Problem[] } | null>(null);

  const topic = topicById(topicId);

  useEffect(() => {
    saveSettings({ ...settings, mode });
  }, [settings, mode]);
  // při změně obrazovky nahoru (scrollTo v novějších prohlížečích vrací Promise → nesmí být návratovou hodnotou efektu)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen, run?.id]);

  const go = (s: Screen) => setScreen(s);
  const openTopic = (id: TopicId) => {
    setTopicId(id);
    go("setup");
  };
  const startTest = () => {
    const s = settings[topicId];
    // příklady z posledních testů se přednostně vynechají → každé spuštění je jiné
    const problems = topic.create(s, countOf(s), loadRecent(topicId));
    rememberRecent(topicId, problems.map((p) => p.key));
    setRun((r) => ({ id: (r?.id ?? 0) + 1, problems }));
    go("test");
  };

  return (
    <div className="min-h-screen">
      <Header page={screen === "progress" ? "progress" : "practice"} onNavigate={(p) => go(p === "progress" ? "progress" : "hub")} />
      <main>
        {screen === "hub" && <Dashboard stats={stats} onPick={openTopic} onProgress={() => go("progress")} />}
        {screen === "progress" && <Progress stats={stats} onPick={openTopic} onHome={() => go("hub")} />}
        {screen === "setup" && (
          <Setup
            topic={topic}
            mode={mode}
            setMode={setMode}
            settings={settings[topicId]}
            setSettings={(s) => setSettings((all) => ({ ...all, [topicId]: s }))}
            onStart={startTest}
            onBack={() => go("hub")}
          />
        )}
        {screen === "test" && run && (
          <TestRun
            key={run.id}
            topic={topic}
            problems={run.problems}
            mode={mode}
            onFinish={(stars, percent) => setStats(recordTest(topicId, stars, percent))}
            onNew={startTest}
            onSetup={() => go("setup")}
            onHome={() => go("hub")}
          />
        )}
      </main>
    </div>
  );
}

/** Jeden běh testu: průběh a po dokončení vyhodnocení. */
function TestRun({
  topic,
  problems,
  mode,
  onFinish,
  onNew,
  onSetup,
  onHome,
}: {
  topic: Topic;
  problems: Problem[];
  mode: Mode;
  onFinish: (stars: number, percent: number) => void;
  onNew: () => void;
  onSetup: () => void;
  onHome: () => void;
}) {
  const [state, dispatch] = useQuiz(problems, STREAK_FOR_STAR);
  const recorded = useRef(false);

  useEffect(() => {
    if (!state.finished || recorded.current) return;
    recorded.current = true;
    const first = state.attempts.filter((a) => a.problem.retry === 0);
    const percent = first.length ? Math.round((first.filter((a) => a.correct).length / first.length) * 100) : 0;
    onFinish(state.stars, percent);
  }, [state.finished, state.attempts, state.stars, onFinish]);

  if (state.finished) {
    return <Results topic={topic} attempts={state.attempts} stars={state.stars} onNew={onNew} onSetup={onSetup} onHome={onHome} />;
  }
  return <Quiz topic={topic} state={state} dispatch={dispatch} mode={mode} onSettings={onSetup} onHome={onHome} />;
}
