import { ArrowRight, RotateCcw, Star } from "lucide-react";
import type { Attempt } from "../lib/core";
import type { Topic } from "../lib/topics";
import { Mascot } from "./Art";
import { BackLink, Panel, cx } from "./ui";

export function Results({
  topic,
  attempts,
  stars,
  onNew,
  onSetup,
  onHome,
}: {
  topic: Topic;
  attempts: Attempt[];
  stars: number;
  onNew: () => void;
  onSetup: () => void;
  onHome: () => void;
}) {
  const first = attempts.filter((a) => a.problem.retry === 0);
  const correct = first.filter((a) => a.correct).length;
  const wrong = first.filter((a) => !a.correct);
  const ratio = first.length ? correct / first.length : 0;
  const praise =
    ratio === 1 ? "Všechno správně napoprvé! 🎉" : ratio >= 0.8 ? "Skvělá práce!" : ratio >= 0.5 ? "Dobrá práce, jen tak dál!" : "Nevzdávej to – každým příkladem se zlepšuješ.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <BackLink onClick={onHome} />
      <Panel className="mt-3 p-6 text-center sm:p-8">
        <Mascot kind="cow" className="anim-bob mx-auto -mt-2 w-40 sm:w-48" />
        <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.14em] text-gradient">Hotovo · {topic.title}</p>
        <div className="nums mt-2 text-6xl font-extrabold">
          {correct} <span className="text-3xl text-muted-foreground">z {first.length}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">správně napoprvé</p>
        <p className="mt-3 text-xl font-extrabold">{praise}</p>

        <div className="mt-5 flex min-h-10 flex-wrap items-center justify-center gap-1.5">
          {stars === 0 ? (
            <span className="text-sm text-muted-foreground">Hvězdičku získáš za 5 správných odpovědí v řadě. Příště to vyjde!</span>
          ) : (
            <>
              {Array.from({ length: stars }, (_, i) => (
                <Star key={i} className="anim-star size-10 fill-star text-star" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
              <span className="ml-2 font-extrabold text-warning">
                +{stars} {stars === 1 ? "hvězdička" : stars <= 4 ? "hvězdičky" : "hvězdiček"}
              </span>
            </>
          )}
        </div>

        <div className="mx-auto mt-6 grid max-w-sm grid-cols-10 gap-1.5">
          {first.map((a, i) => (
            <div
              key={a.problem.id}
              title={`${i + 1}. ${a.problem.summary}`}
              className={cx(
                "nums grid aspect-square place-items-center rounded-md text-xs font-extrabold",
                a.correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <button
          onClick={onNew}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl btn-primary py-4 text-lg font-extrabold"
        >
          Procvičovat znovu <ArrowRight className="size-5" />
        </button>
        <button onClick={onSetup} className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-4" /> Změnit nastavení
        </button>
      </Panel>

      {wrong.length > 0 && (
        <Panel className="mt-5 p-5 sm:p-6">
          <h2 className="font-extrabold">Tyhle příklady si ještě zopakuj</h2>
          <ul className="mt-3 divide-y divide-border">
            {wrong.map((a) => (
              <li key={a.problem.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="nums text-lg font-extrabold">{a.problem.summary}</span>
                {a.given && (
                  <span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-bold text-danger">
                    napoprvé: {a.given}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
