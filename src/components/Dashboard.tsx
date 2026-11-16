import { ArrowRight, Check, ChartNoAxesColumnIncreasing, Rocket, Sparkles, Star } from "lucide-react";
import type { TopicId } from "../lib/core";
import type { Stats } from "../lib/stats";
import { TOPICS } from "../lib/topics";
import { Mascot } from "./Art";
import { StarRow, TOPIC_STYLE, TopicIcon, cx } from "./ui";

/** Rozložení dlaždic na velké obrazovce: tři nahoře, dvě širší dole. */
const SPAN = ["lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3", "lg:col-span-3"];

export function Dashboard({
  stats,
  onPick,
  onProgress,
}: {
  stats: Stats;
  onPick: (id: TopicId) => void;
  onProgress: () => void;
}) {
  const totalStars = Object.values(stats).reduce((sum, t) => sum + (t?.stars ?? 0), 0);
  const scrollToTopics = () => document.getElementById("temata")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-4 pb-4 pt-8 sm:px-6 md:grid-cols-[1fr_auto] md:gap-8 md:py-12">
          <div>
            <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-foreground/90">
              <Sparkles className="size-4 text-t-pink" /> Velká dobrodružství pro malé počtáře
            </p>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Matematika hrou.
              <br />
              <span className="text-gradient">Dnes to zase zvládneš!</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Každý příklad je nový objev. Vyber si, co si dnes procvičíš, a pojď sbírat hvězdičky.
            </p>
            <button
              onClick={scrollToTopics}
              className="btn-primary mt-7 inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-lg font-extrabold"
            >
              Jdeme počítat <ArrowRight className="size-5" />
            </button>
          </div>
          <div className="relative mx-auto w-64 sm:w-72 md:w-[25rem]">
            <div className="absolute inset-[14%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,79,216,0.45),rgba(139,92,246,0.25)_45%,transparent_70%)] blur-2xl" />
            <Mascot kind="pig" eager className="anim-bob w-full" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <section id="temata" className="scroll-mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">Co dnes procvičíme?</h2>
              <p className="mt-1 text-muted-foreground">Vyber si své malé matematické dobrodružství.</p>
            </div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Check className="size-4 text-success" strokeWidth={3} /> V tvém tempu. Bez stresu.
            </p>
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-5">
            {TOPICS.map((t, i) => {
              const st = TOPIC_STYLE[t.id];
              const s = stats[t.id];
              return (
                <li key={t.id} className={cx(SPAN[i], i === 4 && "sm:col-span-2 lg:col-span-3")}>
                  <button
                    onClick={() => onPick(t.id)}
                    className={cx(
                      "glass group flex h-full w-full flex-col rounded-3xl p-5 text-left outline-none transition duration-300 sm:p-6",
                      "hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-brand/30",
                      st.hoverCard,
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <TopicIcon id={t.id} />
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        {s && s.stars > 0 ? (
                          <>
                            <Star className="size-4 fill-star text-star" /> {s.stars}
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3.5" /> {t.badge}
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold">{t.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t.lines[0]}
                      <br />
                      {t.lines[1]}
                    </p>
                    <p className={cx("nums mt-5 font-extrabold", t.id === "word" ? "text-xl" : "text-2xl", st.text)}>{t.example}</p>
                    {/* mt-auto přitlačí tlačítko ke spodku karty, pt-6 drží stálý odstup od příkladu */}
                    <span className="mt-auto block w-full pt-6">
                      <span className={cx("flex items-center justify-between rounded-xl px-4 py-3 text-sm font-extrabold transition", st.btn)}>
                        Procvičovat <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="glass mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-5 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning-soft text-warning ring-1 ring-white/10">
              <Star className="size-6" strokeWidth={2} />
            </span>
            <div>
              <p className="font-extrabold">Každý příklad je malá výhra</p>
              <p className="text-sm text-muted-foreground">
                {totalStars > 0
                  ? `Máš už ${totalStars} ${totalStars === 1 ? "hvězdičku" : totalStars <= 4 ? "hvězdičky" : "hvězdiček"}. Za 5 správných výsledků v řadě přibude další.`
                  : "Nasbírej hvězdičky za 5 správných výsledků v řadě."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <StarRow filled={Math.min(totalStars, 5)} size="size-6" label={`Celkem ${totalStars} hvězdiček`} />
            <button onClick={onProgress} className="inline-flex items-center gap-2 text-sm font-bold text-t-cyan hover:underline">
              Můj pokrok <ChartNoAxesColumnIncreasing className="size-4" />
            </button>
          </div>
        </section>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Rocket className="size-4 text-t-pink" /> I pár minut počítání denně dělá velké věci.
        </p>
      </div>
    </>
  );
}
