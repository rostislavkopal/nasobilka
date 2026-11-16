import { ArrowRight, Star, Trophy } from "lucide-react";
import type { TopicId } from "../lib/core";
import type { Stats } from "../lib/stats";
import { TOPICS } from "../lib/topics";
import { Mascot } from "./Art";
import { BackLink, Panel, TOPIC_STYLE, TopicIcon, cx } from "./ui";

const tests = (n: number) => `${n} ${n === 1 ? "trénink" : n >= 2 && n <= 4 ? "tréninky" : "tréninků"}`;

export function Progress({ stats, onPick, onHome }: { stats: Stats; onPick: (id: TopicId) => void; onHome: () => void }) {
  const total = Object.values(stats).reduce((s, t) => s + (t?.stars ?? 0), 0);
  const trained = Object.values(stats).reduce((s, t) => s + (t?.tests ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <BackLink onClick={onHome} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Můj pokrok</h1>
          <p className="mt-1 text-muted-foreground">
            {trained > 0 ? `Zatím máš za sebou ${tests(trained)}. Jen tak dál!` : "Tady uvidíš, jak ti to jde. Začni prvním tréninkem!"}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-warning-soft px-5 py-3 ring-1 ring-white/10">
          <Trophy className="size-7 text-warning" />
          <div>
            <div className="nums text-2xl font-extrabold leading-none">{total}</div>
            <div className="text-xs font-bold text-muted-foreground">hvězdiček celkem</div>
          </div>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {TOPICS.map((t) => {
          const s = stats[t.id];
          const st = TOPIC_STYLE[t.id];
          return (
            <li key={t.id}>
              <Panel className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                <TopicIcon id={t.id} />
                <div className="min-w-40 flex-1">
                  <div className="font-extrabold">{t.title}</div>
                  <div className="text-sm text-muted-foreground">{s ? tests(s.tests) : "Ještě jsi nezkoušel(a)"}</div>
                </div>
                <div className="w-full max-w-56 sm:w-56">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Nejlepší výsledek</span>
                    <span className="nums">{s ? `${s.best} %` : "—"}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cx("h-full rounded-full bg-current shadow-[0_0_10px_currentColor] transition-all", st.text)} style={{ width: `${s?.best ?? 0}%` }} />
                  </div>
                </div>
                <span className="nums inline-flex w-14 items-center gap-1 font-extrabold">
                  <Star className="size-5 fill-star text-star" /> {s?.stars ?? 0}
                </span>
                <button
                  onClick={() => onPick(t.id)}
                  className={cx("group inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-extrabold transition", st.btn)}
                >
                  Procvičovat <ArrowRight className="size-4" />
                </button>
              </Panel>
            </li>
          );
        })}
      </ul>

      <Mascot kind="goat" className="mx-auto mt-8 w-44 sm:w-52" />
    </div>
  );
}
