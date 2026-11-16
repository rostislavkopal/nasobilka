# Matematika hrou – dokumentace webové aplikace

Webová aplikace pro procvičování matematiky 3. třídy ZŠ: násobilka, pamětné sčítání a odčítání,
přednost operací, převody jednotek délky a slovní úlohy.

---

## Část 1 – Uživatelská příručka

### Rozcestník

Nahoře úvodní pás s barevnou kozou a tlačítkem „Jdeme počítat“, pod ním pět dlaždic s tématy
a pás s nasbíranými hvězdičkami. V hlavičce je navigace **Procvičování** / **Můj pokrok**.
Stránka **Můj pokrok** ukazuje u každého tématu počet tréninků, nejlepší výsledek a hvězdičky.

| Téma | Co se procvičuje | Volby |
| --- | --- | --- |
| **Násobení a dělení** | `7 · 8`, `56 : 7`, větší příklady `13 · 4`, `84 : 4` | násobení / dělení / obojí; do 5, do 10, větší příklady |
| **Sčítání a odčítání** | `57 + 34`, `83 − 45` (dvojciferná čísla, výsledek do 100) | sčítání / odčítání / obojí; bez přechodu, s přechodem, obojí |
| **Přednosti a závorky** | `75 + 56 : 8`, `(45 + 9) : (12 − 6)` | bez závorek, se závorkami, obojí |
| **Převody jednotek** | `3 m = ? cm`, `400 cm = ? m`, `4 dm 5 cm = ? cm`, `45 cm = ? dm ? cm` | jedna jednotka / smíšené / obojí; sousední jednotky, nebo všemi |
| **Slovní úlohy** | krátký příběh → zápis → výpočet → odpověď | jednoduché / složené (dva početní kroky) / obojí |

Po kliknutí na dlaždici se otevře nastavení: **Jak budeš odpovídat?** (napsat výsledek / vybrat
odpověď), **Kolik příkladů?** (10 / 20) a volby tématu. Nastavení se pamatuje.

### Průběh testu

- Nahoře je „Příklad 3 z 10“, ukazatel průběhu a pět hvězdiček série.
- Příklad je uprostřed (`5 · 9 = ?`), pod ním políčko pro výsledek a tlačítko **Zkontrolovat**
  (nebo Enter), případně návrhy odpovědí.
- **Jednotky:** za políčkem je vždy štítek jednotky (`cm`, `dm` …). U smíšených převodů jsou
  políčka dvě; Enter s prázdným políčkem přesune kurzor do něj.
- **Slovní úlohy** mají tři kroky (ukazatel 1. Zápis → 2. Výpočet → 3. Odpověď):
  1. výběr správného zápisu (výrazu) ze čtyř možností,
  2. výpočet – podle zvoleného režimu výběrem nebo psaním,
  3. výběr správné odpovědi celou větou.
  Hotové kroky zůstávají vidět pod zadáním. Chyba v libovolném kroku znamená chybnou úlohu.
- **Potřebuji nápovědu** ukáže jemnou nápovědu, která neprozradí výsledek.
- **Zpětná vazba:**
  - správně → zelené „Skvěle!“ a po chvíli další příklad,
  - první chyba → „Ještě to není ono. Zkus to znovu!“ s nápovědou; žák odpověď opraví hned,
  - druhá chyba → správné řešení s postupem „Jak na to“ a tlačítko **Pokračovat**;
    takový příklad se vrátí o 3 příklady později s označením „Oprava“.
- **Hvězdičky:** pět hvězdiček nahoře se plní správnými odpověďmi napoprvé v řadě; po zaplnění
  žák získá hvězdičku (pohár). Chyba sérii vynuluje.

### Vyhodnocení

Skóre „správně napoprvé“, získané hvězdičky, mřížka příkladů, seznam příkladů k zopakování.
Tlačítka **Procvičovat znovu**, **Změnit nastavení** a odkaz zpět na rozcestník.

### Ovládání klávesnicí

Políčka jsou běžné vstupy (na mobilu se otevře číselná klávesnice). Enter = Zkontrolovat,
Tab přepíná políčka, po ukázání řešení je zaměřené tlačítko Pokračovat (Enter).

---

## Část 2 – Dokumentace pro vývojáře

### Technologie

React 19, Vite 7, TypeScript, Tailwind CSS v4, ikony `lucide-react`, písmo Nunito
(`@fontsource-variable/nunito`, přibalené), testy `vitest`.
Statická SPA bez backendu. Hvězdičky, nejlepší výsledky a nastavení se ukládají do `localStorage`
(čtení i zápis v `try/catch` – aplikace funguje i bez úložiště).

```bash
npm run dev     # vývojový server
npm test        # testy generátorů a reduceru
npm run build   # kontrola typů + build do dist/
```

### Struktura

```
src/
  lib/
    core.ts        společné typy (Problem, Step, Choice), náhoda, čeština (plural), návrhy odpovědí, fronta opakování
    muldiv.ts      násobení a dělení
    addsub.ts      sčítání a odčítání do 100
    expr.ts        strom výrazu, vyhodnocení krok za krokem, šablony přednosti operací
    units.ts       převody m / dm / cm / mm
    word.ts        šablony slovních úloh → tři kroky
    topics.ts      registr témat (volby, výchozí nastavení, délka testu, generátor)
    stats.ts       localStorage: hvězdičky, nejlepší výsledek, nastavení
    generators.test.ts
  quiz/
    useQuiz.ts     reducer testu + automatický posun po správné odpovědi
    useQuiz.test.ts
  components/
    Dashboard.tsx  rozcestník: úvodní pás, dlaždice témat, pás s hvězdičkami
    Progress.tsx   stránka „Můj pokrok“
    Setup.tsx      nastavení tématu (generické podle OptionGroup)
    Quiz.tsx       průběh testu: rovnost, vstupy / návrhy, kroky slovní úlohy, nápověda, zpětná vazba
    Results.tsx    vyhodnocení
    Art.tsx        ilustrace zvířat (src/assets/*.webp) a logo
    ui.tsx         Header, Panel, OptionButton, StarRow, barvy a ikony témat
  App.tsx          obrazovky hub → setup → test (→ vyhodnocení)
```

### Doménový model

Každý příklad je `Problem` s jedním nebo více kroky (`Step`):

```ts
interface Step {
  title?: string;      // „Zápis“ / „Výpočet“ / „Odpověď“ (slovní úlohy)
  prompt: string;      // pokyn nad odpověďmi
  left?: string;       // levá strana rovnosti: „75 + 56 : 8“, „4 dm 5 cm“
  slots: Slot[];       // políčka pro psaní, Slot = { suffix?: "cm" }; prázdné = jen výběr
  answer: number[];    // správné hodnoty políček
  choices: Choice[];   // návrhy { label, correct }
  hint: string;        // jemná nápověda bez výsledku
  explain: string[];   // celý postup po druhé chybě
  done: string;        // shrnutí kroku po dokončení
}
interface Problem { id; key; topic; tag; story?; steps: Step[]; summary; retry }
```

Generátory jsou čisté funkce a zaručují:

- **dělení vždy beze zbytku** – dělenec vzniká jako součin dělitele a podílu,
- **žádné záporné ani necelé mezivýsledky** – `expr.ts` vyhodnocuje strom výrazu operaci po
  operaci a neplatné výrazy zahodí (`retryUntil`); výsledky a mezivýsledky jsou v rozsahu 0–100,
- **sčítání a odčítání:** obě čísla dvojciferná, součet ≤ 100, rozdíl ≥ 1, přechod desítky podle volby,
- **jednotky:** čísla do 1000; ve složeném převodu je menší jednotka vždy menší než 1 větší jednotka,
- **distraktory** vycházejí z typických chyb (zapomenutý přechod, počítání zleva doprava bez
  ohledu na přednost, posun o řád u jednotek, chybná operace ve slovní úloze).

**Pestrost příkladů** (`uniqueSet` v `core.ts`):
- v jednom testu se žádný příklad neopakuje,
- příklady z posledních tří testů daného tématu (`localStorage`, `nasobilka.recent.v1`) se losují
  jen tehdy, když jiné nezbývají,
- „rodiny“ (`Problem.family`: řada násobilky, šablona výrazu, dvojice jednotek, typ příběhu) se
  rozkládají rovnoměrně – nejvýš ⌈počet příkladů / počet rodin⌉ z jedné,
- u násobilky padají triviální činitele 1 a 10 jen asi v 10 % případů,
- slovní úlohy mají 31 typů příběhů (22 jednoduchých, 9 složených).

`generators.test.ts` tisíckrát generuje každý typ a nezávisle ověřuje výsledek (výrazy přepočítá
JavaScript, jednotky se převedou na milimetry).

### Stav testu (`useQuiz.ts`)

`useReducer` s akcemi `type`, `submitTyped`, `pick`, `continue`. Zpětná vazba má tři stavy:
`correct` (efekt za 900 ms odešle `continue`), `retry` (první chyba, žák opravuje) a `reveal`
(druhá chyba, čeká se na Pokračovat). Při uzavření příkladu se zapíše `Attempt` (správně = všechny
kroky napoprvé), aktualizuje série a hvězdičky (`streak % 5 === 0`) a příklad, u kterého se
ukázalo řešení, se zařadí k opakování (`scheduleRetry`).
Skóre se počítá jen z prvních pokusů (`retry === 0`).

### Přidání nového tématu

1. Napsat generátor `createXyzTest(settings, size): Problem[]` v `src/lib/` (volby číst přes `expand()`).
2. Přidat položku do `TOPICS` v `topics.ts` (texty dlaždice, volby, výchozí hodnoty).
3. Přidat id do typu `TopicId` a barvu/ikonu do `TOPIC_STYLE` v `components/ui.tsx`.

### Design systém

Tmavý neonový motiv odvozený z ilustrací zvířat. Tokeny v `src/styles.css`:
`--background` (tmavě indigová) s „polární září“ (`body::before`, barevné radiální přechody),
`--card` / třída `.glass` (poloprůhledné skleněné karty s rozostřením), hlavní přechod `--gradient`
(magenta → fialová → tyrkysová) pro `.btn-primary` a `.text-gradient`, barvy témat
`--t-cyan|orange|violet|gold|pink` (+ `-soft`, `-mid`), `--success`, `--danger`, `--warning`, `--star`.
Písmo Nunito. Animace `anim-pop`, `anim-shake`, `anim-star`, `anim-rise`, `anim-bob` respektují
`prefers-reduced-motion`.

**Ilustrace** (`src/assets/`): `koza-zepredu.webp` (rozcestník), `krava.webp` (vyhodnocení),
`koza-profil.webp` (nastavení, Můj pokrok). Originály (~4000 px PNG) jsou zmenšené na ≤ 900 px
WebP s průhledností; u kozy z profilu byla odstraněna tmavá aura a uříznutý krk plynule mizí.
