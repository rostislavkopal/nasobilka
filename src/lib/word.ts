/* Slovní úlohy pro 3. třídu: zápis (výběr výrazu) → výpočet → slovní odpověď. */
import {
  type Problem, type Settings, type Step, count as cnt, numericChoices, pick, plural, randInt,
  retryUntil, shuffle, textChoices, uniqueSet, uuid,
} from "./core";
import { expand } from "./expand";
import { type Expr, add, div, evaluate, format, mul, par, sub } from "./expr";

export type WordKind = "one" | "two";

interface Person {
  name: string;
  girl: boolean;
}

const PEOPLE: Person[] = [
  { name: "Ema", girl: true }, { name: "Klára", girl: true }, { name: "Anička", girl: true },
  { name: "Natálka", girl: true }, { name: "Sofie", girl: true }, { name: "Tom", girl: false },
  { name: "Jakub", girl: false }, { name: "Ondra", girl: false }, { name: "Vojta", girl: false },
  { name: "Matěj", girl: false },
];

/** Slovesný tvar podle rodu: g(p, "koupil", "koupila"). */
const g = (p: Person, boy: string, girl: string) => (p.girl ? girl : boy);
const KRAT = ["", "", "dvakrát", "třikrát", "čtyřikrát", "pětkrát"];
/** „je 6 koz“ × „jsou 3 kozy“ × „je 1 koza“ */
const jeJsou = (n: number) => (n >= 2 && n <= 4 ? "jsou" : "je");
const dny = (n: number) => cnt(n, "den", "dny", "dní");

interface WordSpec {
  id: string;
  kind: WordKind;
  story: string;
  question: string;
  expr: Expr;
  /** Chybné zápisy (typické omyly). Neplatné výrazy se samy vyřadí. */
  wrong: Expr[];
  /** Odpověď celou větou pro dané číslo. */
  answer: (n: number) => string;
}

type Template = () => WordSpec | null;

const two = (): [Person, Person] => {
  const [a, b] = shuffle(PEOPLE);
  return [a, b];
};

const TEMPLATES: Template[] = [
  /* ── jednoduché úlohy ── */
  () => {
    const p = pick(PEOPLE);
    const a = randInt(2, 9);
    const b = randInt(5, 9);
    return {
      id: `bal:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "koupil", "koupila")} ${cnt(a, "balíček", "balíčky", "balíčků")} bonbonů. V každém balíčku je ${b} bonbonů.`,
      question: `Kolik bonbonů ${g(p, "koupil", "koupila")} celkem?`,
      expr: mul(a, b), wrong: [add(a, b), sub(b, a), sub(a, b)],
      answer: (n) => `${p.name} ${g(p, "koupil", "koupila")} celkem ${cnt(n, "bonbon", "bonbony", "bonbonů")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const b = randInt(2, 6);
    const q = randInt(2, 9);
    const a = b * q;
    return {
      id: `deli:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "dostal", "dostala")} ${cnt(a, "bonbon", "bonbony", "bonbonů")} a rozdělí je rovným dílem mezi ${cnt(b, "kamaráda", "kamarády", "kamarádů")}.`,
      question: "Kolik bonbonů dostane každý kamarád?",
      expr: div(a, b), wrong: [sub(a, b), mul(a, b), add(a, b)],
      answer: (n) => `Každý kamarád dostane ${cnt(n, "bonbon", "bonbony", "bonbonů")}.`,
    };
  },
  () => {
    const b = randInt(2, 6);
    const q = randInt(3, 9);
    const a = b * q;
    if (a < 10) return null;
    return {
      id: `skup:${a}:${b}`, kind: "one",
      story: `Ve třídě je ${a} dětí. Paní učitelka je rozdělí do skupin po ${b} dětech.`,
      question: "Kolik skupin paní učitelka vytvoří?",
      expr: div(a, b), wrong: [sub(a, b), add(a, b), mul(a, b)],
      answer: (n) => `Paní učitelka vytvoří ${cnt(n, "skupinu", "skupiny", "skupin")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(25, 70);
    const b = randInt(11, 30);
    return {
      id: `kc+:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "měl", "měla")} v pokladničce ${a} Kč. Od babičky ${g(p, "dostal", "dostala")} ještě ${b} Kč.`,
      question: `Kolik korun má ${p.name} teď?`,
      expr: add(a, b), wrong: [sub(a, b), mul(a, b)],
      answer: (n) => `${p.name} má teď ${n} Kč.`,
    };
  },
  () => {
    const a = randInt(30, 90);
    const b = randInt(5, a - 5);
    return {
      id: `bus:${a}:${b}`, kind: "one",
      story: `V autobusu jelo ${a} lidí. Na zastávce ${b} lidí vystoupilo.`,
      question: "Kolik lidí jede autobusem dál?",
      expr: sub(a, b), wrong: [add(a, b), mul(a, b)],
      answer: (n) => `Autobusem jede dál ${n} ${plural(n, "člověk", "lidé", "lidí")}.`,
    };
  },
  () => {
    const [p, q] = two();
    const b = randInt(12, 60);
    const a = b + randInt(5, 35);
    return {
      id: `str:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "přečetl", "přečetla")} ${a} stran knížky, ${q.name} ${g(q, "přečetl", "přečetla")} ${b} stran.`,
      question: `O kolik stran ${g(p, "přečetl", "přečetla")} ${p.name} více než ${q.name}?`,
      expr: sub(a, b), wrong: [add(a, b), mul(a, b)],
      answer: (n) => `${p.name} ${g(p, "přečetl", "přečetla")} o ${cnt(n, "stranu", "strany", "stran")} více.`,
    };
  },
  () => {
    const [p, q] = two();
    const a = randInt(12, 50);
    const b = randInt(5, 30);
    return {
      id: `vic:${a}:${b}`, kind: "one",
      story: `${p.name} má ${cnt(a, "pastelku", "pastelky", "pastelek")}. ${q.name} má o ${cnt(b, "pastelku", "pastelky", "pastelek")} více.`,
      question: `Kolik pastelek má ${q.name}?`,
      expr: add(a, b), wrong: [sub(a, b), mul(a, b)],
      answer: (n) => `${q.name} má ${cnt(n, "pastelku", "pastelky", "pastelek")}.`,
    };
  },
  () => {
    const [p, q] = two();
    const a = randInt(5, 20);
    const k = randInt(2, 5);
    return {
      id: `krat:${a}:${k}`, kind: "one",
      story: `${p.name} má ${cnt(a, "kuličku", "kuličky", "kuliček")}. ${q.name} má ${KRAT[k]} více kuliček.`,
      question: `Kolik kuliček má ${q.name}?`,
      expr: mul(a, k), wrong: [add(a, k), sub(a, k)],
      answer: (n) => `${q.name} má ${cnt(n, "kuličku", "kuličky", "kuliček")}.`,
    };
  },
  () => {
    const k = randInt(2, 5);
    const q = randInt(2, 9);
    const a = k * q;
    if (a < 10) return null;
    return {
      id: `mene:${a}:${k}`, kind: "one",
      story: `Na zahradě roste ${a} tulipánů a ${KRAT[k]} méně narcisů.`,
      question: "Kolik narcisů roste na zahradě?",
      expr: div(a, k), wrong: [sub(a, k), add(a, k), mul(a, k)],
      answer: (n) => `Na zahradě ${n >= 2 && n <= 4 ? "rostou" : "roste"} ${cnt(n, "narcis", "narcisy", "narcisů")}.`,
    };
  },
  () => {
    const a = randInt(2, 9);
    const b = randInt(3, 9);
    return {
      id: `liz:${a}:${b}`, kind: "one",
      story: `Jedno lízátko stojí ${b} Kč.`,
      question: `Kolik korun zaplatíme za ${cnt(a, "lízátko", "lízátka", "lízátek")}?`,
      expr: mul(a, b), wrong: [add(a, b), sub(b, a), sub(a, b)],
      answer: (n) => `Za ${cnt(a, "lízátko", "lízátka", "lízátek")} zaplatíme ${n} Kč.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(2, 9);
    const q = randInt(3, 10);
    const total = a * q;
    return {
      id: `pohl:${a}:${total}`, kind: "one",
      story: `${p.name} ${g(p, "zaplatil", "zaplatila")} za ${a} ${plural(a, "pohled", "stejné pohledy", "stejných pohledů")} ${total} Kč.`,
      question: "Kolik korun stál jeden pohled?",
      expr: div(total, a), wrong: [sub(total, a), mul(total, a), add(total, a)],
      answer: (n) => `Jeden pohled stál ${n} Kč.`,
    };
  },

  () => {
    const a = randInt(12, 60);
    const b = randInt(5, 30);
    return {
      id: `knihy:${a}:${b}`, kind: "one",
      story: `Na polici je ${a} knížek. Paní učitelka přidala dalších ${b} knížek.`,
      question: "Kolik knížek je teď na polici?",
      expr: add(a, b), wrong: [sub(a, b), mul(a, b), div(a, b)],
      answer: (n) => `Na polici je teď ${n} knížek.`,
    };
  },

  () => {
    const a = randInt(2, 9);
    return {
      id: `kozy:${a}`, kind: "one",
      story: `Ve výběhu ${jeJsou(a)} ${cnt(a, "koza", "kozy", "koz")}. Každá koza má 4 nohy.`,
      question: "Kolik nohou mají všechny kozy dohromady?",
      expr: mul(a, 4), wrong: [add(a, 4), sub(a, 4), sub(4, a)],
      answer: (n) => `Všechny kozy mají dohromady ${cnt(n, "nohu", "nohy", "nohou")}.`,
    };
  },
  () => {
    const a = randInt(2, 7);
    const b = randInt(8, 14);
    return {
      id: `mleko:${a}:${b}`, kind: "one",
      story: `Kráva Stračena dá každý den ${b} litrů mléka.`,
      question: `Kolik litrů mléka dá za ${dny(a)}?`,
      expr: mul(b, a), wrong: [add(b, a), sub(b, a)],
      answer: (n) => `Za ${dny(a)} dá Stračena ${n} litrů mléka.`,
    };
  },
  () => {
    const b = randInt(2, 6);
    const q = randInt(3, 9);
    const a = b * q;
    return {
      id: `kose:${a}:${b}`, kind: "one",
      story: `Děda nasbíral ${a} jablek a rozdělil je stejně do ${b} košíků.`,
      question: "Kolik jablek je v každém košíku?",
      expr: div(a, b), wrong: [sub(a, b), mul(a, b), add(a, b)],
      answer: (n) => `V každém košíku ${jeJsou(n)} ${cnt(n, "jablko", "jablka", "jablek")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(2, 7);
    const b = randInt(5, 12);
    return {
      id: `cteni:${a}:${b}`, kind: "one",
      story: `${p.name} přečte každý den ${b} stránek knížky.`,
      question: `Kolik stránek přečte za ${dny(a)}?`,
      expr: mul(b, a), wrong: [add(b, a), sub(b, a)],
      answer: (n) => `Za ${dny(a)} přečte ${p.name} ${n} stránek.`,
    };
  },
  () => {
    const [p, q] = two();
    const a = randInt(25, 60);
    const b = randInt(10, a - 3);
    return {
      id: `micek:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "hodil", "hodila")} míčkem do vzdálenosti ${a} m, ${q.name} ${g(q, "hodil", "hodila")} jen ${b} m.`,
      question: `O kolik metrů ${g(p, "hodil", "hodila")} ${p.name} dál?`,
      expr: sub(a, b), wrong: [add(a, b), mul(a, b)],
      answer: (n) => `${p.name} ${g(p, "hodil", "hodila")} o ${n} m dál.`,
    };
  },
  () => {
    const a = randInt(20, 60);
    const b = randInt(5, 35);
    if (a + b > 100) return null;
    return {
      id: `vlak:${a}:${b}`, kind: "one",
      story: `Ve vlaku jelo ${a} cestujících. Na nádraží přistoupilo ještě ${b} cestujících.`,
      question: "Kolik cestujících jede ve vlaku teď?",
      expr: add(a, b), wrong: [sub(a, b), mul(a, b)],
      answer: (n) => `Ve vlaku teď jede ${n} cestujících.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(20, 80);
    const b = randInt(5, a - 5);
    return {
      id: `samol:${a}:${b}`, kind: "one",
      story: `${p.name} ${g(p, "měl", "měla")} ${a} samolepek. Kamarádce ${g(p, "dal", "dala")} ${b} samolepek.`,
      question: `Kolik samolepek má ${p.name} teď?`,
      expr: sub(a, b), wrong: [add(a, b), mul(a, b)],
      answer: (n) => `${p.name} má teď ${cnt(n, "samolepku", "samolepky", "samolepek")}.`,
    };
  },
  () => {
    const a = randInt(2, 9);
    const b = randInt(5, 9);
    return {
      id: `stromy:${a}:${b}`, kind: "one",
      story: `Na zahradě ${jeJsou(a)} ${cnt(a, "řada", "řady", "řad")} stromů. V každé řadě roste ${b} stromů.`,
      question: "Kolik stromů roste na zahradě?",
      expr: mul(a, b), wrong: [add(a, b), sub(b, a), sub(a, b)],
      answer: (n) => `Na zahradě roste ${n} stromů.`,
    };
  },
  () => {
    const b = randInt(5, 10);
    const q = randInt(2, 9);
    const a = b * q;
    return {
      id: `krabicky:${a}:${b}`, kind: "one",
      story: `Paní učitelka má ${a} pastelek. Do každé krabičky dá ${b} pastelek.`,
      question: "Kolik krabiček naplní?",
      expr: div(a, b), wrong: [sub(a, b), mul(a, b), add(a, b)],
      answer: (n) => `Paní učitelka naplní ${cnt(n, "krabičku", "krabičky", "krabiček")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const b = randInt(15, 95);
    return {
      id: `sto:${b}`, kind: "one",
      story: `${p.name} ${g(p, "koupil", "koupila")} hračku za ${b} Kč a ${g(p, "zaplatil", "zaplatila")} stokorunou.`,
      question: `Kolik korun ${g(p, "dostal", "dostala")} zpět?`,
      expr: sub(100, b), wrong: [add(100, b), mul(100, b)],
      answer: (n) => `${p.name} ${g(p, "dostal", "dostala")} zpět ${n} Kč.`,
    };
  },

  /* ── složené úlohy (dva početní kroky) ── */
  () => {
    const p = pick(PEOPLE);
    const a = randInt(2, 6);
    const b = randInt(5, 9);
    const c = randInt(2, a * b - 5);
    return {
      id: `sus:${a}:${b}:${c}`, kind: "two",
      story: `${p.name} ${g(p, "koupil", "koupila")} ${cnt(a, "balíček", "balíčky", "balíčků")} sušenek. V každém balíčku je ${b} sušenek. Cestou ze školy ${g(p, "snědl", "snědla")} ${cnt(c, "sušenku", "sušenky", "sušenek")}.`,
      question: `Kolik sušenek má ${p.name} teď?`,
      expr: sub(mul(a, b), c), wrong: [add(mul(a, b), c), sub(add(a, b), c), mul(a, par(sub(b, c)))],
      answer: (n) => `${p.name} má teď ${cnt(n, "sušenku", "sušenky", "sušenek")}.`,
    };
  },
  () => {
    const c = randInt(3, 5);
    const total = c * randInt(4, 8);
    const a = randInt(5, total - 5);
    const b = total - a;
    if (b < 5) return null;
    return {
      id: `tr:${a}:${b}:${c}`, kind: "two",
      story: `Ve třídě je ${a} chlapců a ${b} dívek. Paní učitelka rozdělí všechny děti do skupin po ${c}.`,
      question: "Kolik skupin vytvoří?",
      expr: div(par(add(a, b)), c), wrong: [add(a, div(b, c)), mul(par(add(a, b)), c), sub(add(a, b), c)],
      answer: (n) => `Paní učitelka vytvoří ${cnt(n, "skupinu", "skupiny", "skupin")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(3, 9);
    const b = randInt(15, 40);
    const c = randInt(2, 6);
    return {
      id: `cok:${a}:${b}:${c}`, kind: "two",
      story: `Lízátko stojí ${a} Kč a čokoláda ${b} Kč. ${p.name} ${g(p, "koupil", "koupila")} ${cnt(c, "lízátko", "lízátka", "lízátek")} a jednu čokoládu.`,
      question: `Kolik korun ${p.name} ${g(p, "zaplatil", "zaplatila")}?`,
      expr: add(mul(c, a), b), wrong: [mul(c, par(add(a, b))), add(add(c, a), b), sub(mul(c, a), b)],
      answer: (n) => `${p.name} ${g(p, "zaplatil", "zaplatila")} ${n} Kč.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const c = randInt(2, 5);
    const b = randInt(4, 9);
    const a = c * b + randInt(5, 50);
    if (a > 100) return null;
    return {
      id: `zb:${a}:${b}:${c}`, kind: "two",
      story: `${p.name} ${g(p, "měl", "měla")} ${a} Kč. ${g(p, "Koupil", "Koupila")} si ${cnt(c, "pohled", "pohledy", "pohledů")}, každý za ${b} Kč.`,
      question: `Kolik korun má ${p.name} teď?`,
      expr: sub(a, mul(c, b)), wrong: [mul(par(sub(a, c)), b), sub(sub(a, c), b), add(a, mul(c, b))],
      answer: (n) => `${p.name} má teď ${n} Kč.`,
    };
  },
  () => {
    const a = randInt(30, 70);
    const b = randInt(5, 25);
    const c = randInt(5, 25);
    if (a - b + c < 5) return null;
    return {
      id: `park:${a}:${b}:${c}`, kind: "two",
      story: `Na parkovišti stálo ${a} aut. Odpoledne ${b} aut odjelo a ${c} aut přijelo.`,
      question: "Kolik aut stojí na parkovišti teď?",
      expr: add(sub(a, b), c), wrong: [sub(a, par(add(b, c))), sub(add(a, b), c), add(add(a, b), c)],
      answer: (n) => `Na parkovišti stojí teď ${cnt(n, "auto", "auta", "aut")}.`,
    };
  },
  () => {
    const c = randInt(2, 5);
    const rest = c * randInt(3, 9);
    const b = randInt(5, 20);
    const a = rest + b;
    if (a > 100) return null;
    return {
      id: `kolac:${a}:${b}:${c}`, kind: "two",
      story: `Maminka upekla ${a} koláčků. ${b} koláčků hned snědli a zbytek rozdělila rovným dílem do ${c} krabic.`,
      question: "Kolik koláčků je v každé krabici?",
      expr: div(par(sub(a, b)), c), wrong: [sub(a, div(b, c)), sub(sub(a, b), c), add(sub(a, b), c)],
      answer: (n) => `V každé krabici ${jeJsou(n)} ${cnt(n, "koláček", "koláčky", "koláčků")}.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(2, 6);
    const b = randInt(5, 15);
    if (a * b > 95) return null;
    return {
      id: `sesity:${a}:${b}`, kind: "two",
      story: `${p.name} ${g(p, "koupil", "koupila")} ${cnt(a, "sešit", "sešity", "sešitů")}, každý za ${b} Kč, a ${g(p, "zaplatil", "zaplatila")} stokorunou.`,
      question: `Kolik korun ${g(p, "dostal", "dostala")} zpět?`,
      expr: sub(100, mul(a, b)), wrong: [sub(sub(100, a), b), add(100, mul(a, b)), mul(par(sub(100, a)), b)],
      answer: (n) => `${p.name} ${g(p, "dostal", "dostala")} zpět ${n} Kč.`,
    };
  },
  () => {
    const a = randInt(2, 6);
    const b = randInt(5, 9);
    const c = randInt(5, 12);
    return {
      id: `zidle:${a}:${b}:${c}`, kind: "two",
      story: `Ve třídě stojí ${cnt(a, "řada", "řady", "řad")} židlí, v každé řadě ${b} židlí. Školník přinesl ještě ${c} židlí.`,
      question: "Kolik židlí je teď ve třídě?",
      expr: add(mul(a, b), c), wrong: [mul(a, par(add(b, c))), add(add(a, b), c), sub(mul(a, b), c)],
      answer: (n) => `Ve třídě je teď ${n} židlí.`,
    };
  },
  () => {
    const p = pick(PEOPLE);
    const a = randInt(20, 50);
    const b = randInt(10, 30);
    if (a + b > 100) return null;
    const c = randInt(15, a + b - 5);
    return {
      id: `kapesne:${a}:${b}:${c}`, kind: "two",
      story: `${p.name} ${g(p, "měl", "měla")} ${a} Kč. Od dědy ${g(p, "dostal", "dostala")} ${b} Kč a pak si ${g(p, "koupil", "koupila")} míč za ${c} Kč.`,
      question: `Kolik korun má ${p.name} teď?`,
      expr: sub(add(a, b), c), wrong: [add(add(a, b), c), sub(sub(a, b), c), sub(a, par(add(b, c)))],
      answer: (n) => `${p.name} má teď ${n} Kč.`,
    };
  },
];

/** Sestaví tři kroky slovní úlohy ze šablony; `null`, pokud čísla nevyšla. */
function build(spec: WordSpec): Problem | null {
  const ev = evaluate(spec.expr);
  if (!ev) return null;
  const v = ev.value;
  if (v < 1) return null;
  const correctExpr = format(spec.expr);

  const wrongExprs = spec.wrong
    .map((e) => ({ e, ev: evaluate(e, 10000) }))
    .filter((w) => w.ev && w.ev.value !== v && format(w.e) !== correctExpr);
  if (wrongExprs.length < 2) return null;

  // nesmyslně velké výsledky chybných zápisů (23 · 20) se jako návrh čísla nenabízí
  const wrongValues = wrongExprs.map((w) => w.ev!.value).filter((n) => n > 0 && n <= 100);
  const extra = [v + 1, v - 1, v + 10, v - 10].filter((n) => n > 0);

  const s1: Step = {
    title: "Zápis",
    prompt: "Který zápis nám pomůže?",
    slots: [],
    answer: [],
    choices: textChoices(correctExpr, wrongExprs.map((w) => format(w.e)), 4),
    explain: [hintFor(spec.expr)],
    // obecné vodítko – neprozradí, kterou operaci zvolit (konkrétní rada je v explain)
    hint: "Přibývá → sčítáme. Ubývá nebo „o kolik“ → odčítáme. Stejné skupiny → násobíme. Dělíme na stejné díly → dělíme.",
    done: correctExpr,
  };
  const slots = [{}];
  const s2: Step = {
    title: "Výpočet",
    prompt: "Vypočítej příklad",
    left: correctExpr,
    slots,
    answer: [v],
    choices: numericChoices(slots, [v], [...wrongValues, ...extra].map((n) => [n]), 5),
    explain: ev.steps.length > 1 ? ev.steps.map((s, i) => `${i + 1}. ${s}`) : [ev.chain],
    hint: ev.steps.length > 1 ? `Počítej postupně. Nejdřív ${ev.steps[0].split(" = ")[0]}.` : "Počítej pozorně, klidně si pomoz rozkladem na desítky a jednotky.",
    done: `${correctExpr} = ${v}`,
  };
  const answerWrong = [...new Set([...wrongValues, ...extra])].filter((n) => n !== v);
  const s3: Step = {
    title: "Odpověď",
    prompt: "Jaká je správná odpověď?",
    slots: [],
    answer: [],
    choices: textChoices(spec.answer(v), shuffle(answerWrong).map(spec.answer), 3),
    explain: [`Výsledek výpočtu je ${v}.`],
    hint: "Vyber větu s číslem, které ti vyšlo ve výpočtu.",
    done: spec.answer(v),
  };

  return {
    id: uuid(),
    key: `word:${spec.id}`,
    topic: "word",
    tag: spec.kind === "one" ? "Jednoduchá úloha" : "Složená úloha",
    story: `${spec.story} ${spec.question}`,
    steps: [s1, s2, s3],
    summary: `${correctExpr} = ${v}`,
    retry: 0,
    family: spec.id.split(":")[0],
  };
}

/** Krátká nápověda podle hlavní operace zápisu. */
function hintFor(e: Expr): string {
  if (typeof e === "number") return "";
  const ops = format(e);
  if (ops.includes("(")) return "Co se má spočítat jako první, dej do závorky.";
  const hints: Record<string, string> = {
    "+": "Přibývá, přidáváme nebo je „o … více“ → sčítáme.",
    "−": "Ubývá, odebíráme nebo se ptáme „o kolik více/méně“ → odčítáme.",
    "·": "Několik stejných skupin nebo „…krát více“ → násobíme.",
    ":": "Dělíme na stejné díly nebo „…krát méně“ → dělíme.",
  };
  const single = typeof e.l === "number" && typeof e.r === "number";
  return single ? hints[e.op] : "Úloha má dva kroky – rozmysli si, co spočítáš nejdřív.";
}

export function createWord(kinds: WordKind[]): Problem {
  return retryUntil(() => {
    const spec = pick(TEMPLATES)();
    if (!spec || !kinds.includes(spec.kind)) return null;
    return build(spec);
  }, 2000);
}

/** Počet typů příběhů podle druhu (zjistí se jednorázově zavoláním šablon). */
let kindCounts: Record<WordKind, number> | null = null;
export function storyCount(kinds: WordKind[]): number {
  if (!kindCounts) {
    kindCounts = { one: 0, two: 0 };
    for (const t of TEMPLATES) kindCounts[retryUntil(t, 200).kind]++;
  }
  return kinds.reduce((sum, k) => sum + kindCounts![k], 0);
}

export function createWordTest(s: Settings, size: number, avoid?: ReadonlySet<string>): Problem[] {
  const kinds = expand(s, "kinds", ["one", "two"]) as WordKind[];
  // v jednom testu se typ příběhu neopakuje, dokud jsou k dispozici jiné
  return uniqueSet(() => createWord(kinds), size, { avoid, families: storyCount(kinds) });
}
