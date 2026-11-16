/* Registr modulů: texty na rozcestníku, volby v nastavení a generátor. */
import type { Problem, Settings, TopicId } from "./core";
import { createAddSubTest } from "./addsub";
import { createOrderTest } from "./expr";
import { createMulDivTest } from "./muldiv";
import { createUnitsTest } from "./units";
import { createWordTest } from "./word";

export interface OptionGroup {
  id: string;
  label: string;
  choices: { value: string; label: string }[];
}

export interface Topic {
  id: TopicId;
  title: string;
  /** Dva krátké řádky popisu na dlaždici. */
  lines: [string, string];
  /** Štítek v pravém horním rohu dlaždice. */
  badge: string;
  /** Ukázka na dlaždici („7 · 8 = ?“). */
  example: string;
  groups: OptionGroup[];
  defaults: Settings;
  /** Slovní úlohy: odpověď se vždy vybírá z možností, výpočet se píše. */
  fixedMode?: boolean;
  /** `avoid` = klíče příkladů z nedávných testů, které se mají přednostně vynechat. */
  create: (s: Settings, size: number, avoid?: ReadonlySet<string>) => Problem[];
}

export const COUNT_CHOICES = ["10", "20"];
/** Kolik správných odpovědí v řadě dá hvězdičku. */
export const STREAK_FOR_STAR = 5;

export const TOPICS: Topic[] = [
  {
    id: "muldiv",
    title: "Násobení a dělení",
    lines: ["Malá násobilka i větší příklady.", "Společně je zvládneme!"],
    badge: "Základ i výzva",
    example: "7 · 8 = ?",
    groups: [
      { id: "ops", label: "Co budeme počítat?", choices: [{ value: "mul", label: "Násobení ·" }, { value: "div", label: "Dělení :" }, { value: "both", label: "Obojí" }] },
      { id: "level", label: "Rozsah násobilky", choices: [{ value: "5", label: "Do 5" }, { value: "10", label: "Do 10" }, { value: "ext", label: "Větší příklady" }] },
    ],
    defaults: { ops: ["both"], level: ["10"] },
    create: createMulDivTest,
  },
  {
    id: "addsub",
    title: "Sčítání a odčítání",
    lines: ["Počítej z hlavy do stovky.", "S přechodem desítky i bez něj."],
    badge: "Počítání z hlavy",
    example: "57 + 34 = ?",
    groups: [
      { id: "ops", label: "Co budeme počítat?", choices: [{ value: "add", label: "Sčítání +" }, { value: "sub", label: "Odčítání −" }, { value: "both", label: "Obojí" }] },
      { id: "crossing", label: "Přechod přes desítku", choices: [{ value: "without", label: "Bez přechodu" }, { value: "with", label: "S přechodem" }, { value: "mixed", label: "Obojí" }] },
    ],
    defaults: { ops: ["both"], crossing: ["with"] },
    create: createAddSubTest,
  },
  {
    id: "order",
    title: "Přednosti a závorky",
    lines: ["Co spočítáš jako první?", "Rozmotej příklady krok za krokem."],
    badge: "Trochu přemýšlení",
    example: "75 + 56 : 8 = ?",
    groups: [
      { id: "brackets", label: "Typ příkladů", choices: [{ value: "without", label: "Bez závorek" }, { value: "with", label: "Se závorkami" }, { value: "mixed", label: "Obojí" }] },
    ],
    defaults: { brackets: ["without"] },
    create: createOrderTest,
  },
  {
    id: "units",
    title: "Převody jednotek",
    lines: ["Metry, decimetry, centimetry a milimetry.", "Všechno má svou míru."],
    badge: "m · dm · cm · mm",
    example: "3 m = ? cm",
    groups: [
      { id: "kinds", label: "Typ převodů", choices: [{ value: "simple", label: "Jedna jednotka" }, { value: "compound", label: "Smíšené jednotky" }, { value: "both", label: "Obojí" }] },
      { id: "pairs", label: "Mezi kterými jednotkami?", choices: [{ value: "neighbors", label: "Sousední" }, { value: "all", label: "Všemi" }] },
    ],
    defaults: { kinds: ["simple"], pairs: ["neighbors"] },
    create: createUnitsTest,
  },
  {
    id: "word",
    title: "Slovní úlohy",
    lines: ["Malé příběhy, velká dobrodružství.", "Najdi zápis, výpočet a odpověď."],
    badge: "Krok za krokem",
    example: "Přečti si. Zamysli se. Vyřeš!",
    groups: [
      { id: "kinds", label: "Typ úloh", choices: [{ value: "one", label: "Jednoduché" }, { value: "two", label: "Složené" }, { value: "both", label: "Obojí" }] },
    ],
    defaults: { kinds: ["both"] },
    fixedMode: true,
    create: createWordTest,
  },
];

export const topicById = (id: TopicId) => TOPICS.find((t) => t.id === id)!;

/** Počet příkladů z nastavení (výchozí 10). */
export const countOf = (s: Settings) => Number(COUNT_CHOICES.includes(s.count?.[0] ?? "") ? s.count![0] : "10");
