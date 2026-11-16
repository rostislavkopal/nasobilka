import { ArrowRight, Check, Keyboard, Lightbulb, ListChecks } from "lucide-react";
import type { Mode, Settings } from "../lib/core";
import { COUNT_CHOICES, type Topic } from "../lib/topics";
import { Mascot } from "./Art";
import { BackLink, OptionButton, Panel, TopicIcon } from "./ui";

export function Setup({
  topic,
  mode,
  setMode,
  settings,
  setSettings,
  onStart,
  onBack,
}: {
  topic: Topic;
  mode: Mode;
  setMode: (m: Mode) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const set = (groupId: string, value: string) => setSettings({ ...settings, [groupId]: [value] });
  const count = settings.count?.[0] ?? "10";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <BackLink onClick={onBack} />
      <Panel className="relative mt-3 p-5 sm:p-8">
        <div className="flex items-center gap-4">
          <TopicIcon id={topic.id} size="size-14" />
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{topic.title}</h1>
            <p className="text-sm text-muted-foreground">Malý trénink, velká radost z počítání.</p>
          </div>
        </div>
        <Mascot kind="goatSide" className="absolute -top-14 right-3 hidden w-32 sm:block" />

        <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {!topic.fixedMode && (
            <Group label="Jak budeš odpovídat?">
              <OptionButton active={mode === "typing"} onClick={() => setMode("typing")} icon={Keyboard}>
                Napsat výsledek
              </OptionButton>
              <OptionButton active={mode === "choice"} onClick={() => setMode("choice")} icon={ListChecks}>
                Vybrat odpověď
              </OptionButton>
            </Group>
          )}
          <Group label="Kolik příkladů?">
            {COUNT_CHOICES.map((c) => (
              <OptionButton key={c} active={count === c} onClick={() => set("count", c)}>
                {c} příkladů
              </OptionButton>
            ))}
          </Group>
          {topic.groups.map((g) => (
            <Group key={g.id} label={g.label}>
              {g.choices.map((c) => (
                <OptionButton key={c.value} active={(settings[g.id] ?? [])[0] === c.value} onClick={() => set(g.id, c.value)}>
                  {c.label}
                </OptionButton>
              ))}
            </Group>
          ))}
        </div>

        {topic.id === "word" && (
          <p className="mt-6 flex flex-wrap items-center gap-2 text-sm font-bold text-t-pink">
            <Check className="size-4" strokeWidth={3} /> Zápis <ArrowRight className="size-4" /> Výpočet <ArrowRight className="size-4" /> Odpověď
          </p>
        )}

        <hr className="my-6 border-border" />
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="size-4 text-warning" /> Nespěchej. Každý příklad můžeš zkusit znovu.
        </p>
        <button
          onClick={onStart}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl btn-primary py-4 text-lg font-extrabold"
        >
          Začít procvičovat <ArrowRight className="size-5" />
        </button>
      </Panel>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 font-extrabold">{label}</div>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  );
}
