# Násobilka – dokumentace webové aplikace

Webová aplikace pro procvičování malé násobilky (násobení a dělení) pro žáky 1. stupně ZŠ.

---

## Část 1 – Uživatelská příručka

### K čemu aplikace slouží

Žák si spustí test o 20 náhodných příkladech. Po odpovědi hned vidí, zda počítal správně.
Na konci testu se zobrazí vyhodnocení a nabídka procvičit znovu jen ty příklady, které byly špatně.

### Úvodní obrazovka (nastavení)

1. **Režim testu**
   - **A – Výběr z 5 návrhů:** u příkladu je pět nabízených výsledků, žák klikne na správný.
   - **B – Psaní na klávesnici:** žák výsledek napíše (číselná tlačítka na obrazovce nebo klávesnice),
     tlačítkem ⌫ maže poslední číslici a tlačítkem ✓ (nebo Enter) odpověď potvrdí.
2. **Počítáme:** násobení, dělení, nebo obojí (alespoň jedna volba musí být zapnutá).
3. **Rozsah:** činitelé do 5 (snadnější) nebo do 10 (celá malá násobilka).
4. Tlačítko **Spustit test (20 příkladů)**.

### Průběh testu

- Nahoře je název testu a průběžné skóre.
- Vlevo je postup (kolikátý příklad, ukazatel průběhu, počet správných, chybných a zbývajících).
- Uprostřed je velký příklad, pod ním odpovědi podle zvoleného režimu.
- Po odpovědi se výsledek krátce zvýrazní zeleně (správně) nebo červeně (chyba) a zobrazí se
  správný výsledek; pak aplikace sama přejde na další příklad.
- Pod příkladem se průběžně vypisuje seznam příkladů, ve kterých žák chyboval.
- Tlačítkem **Ukončit test** se lze vrátit do nastavení.

### Vyhodnocení

- Velké skóre (např. „17 z 20“) a mřížka 20 polí – zelená = správně, červená = chyba.
- Seznam špatně spočítaných příkladů se správným výsledkem i s odpovědí, kterou žák zadal.
- Tlačítka:
  - **Procvičit chyby (N)** – spustí nové kolo pouze s chybnými příklady (lze opakovat, dokud
    nejsou všechny správně).
  - **Nový test** – nových 20 náhodných příkladů se stejným nastavením.
  - **Nastavení** – návrat na úvodní obrazovku.

### Ovládání klávesnicí (režim psaní)

| Klávesa | Akce |
| --- | --- |
| 0–9 | napsat číslici (max. 3 číslice) |
| Backspace | smazat poslední číslici |
| Enter | potvrdit odpověď |

---

## Část 2 – Dokumentace pro vývojáře

### Technologie

- TanStack Start (React 19, TanStack Router, file-based routing), Vite 7, TypeScript.
- Tailwind CSS v4; design tokeny (barvy, písma, poloměry) jsou v `src/styles.css`
  jako CSS proměnné v `oklch` a mapované v bloku `@theme inline`.
- Bez backendu – celý stav je v paměti komponenty, nic se neukládá.

### Struktura souborů

```
src/
  lib/nasobilka.ts     doménová logika (generování, vyhodnocení, opakování)
  routes/index.tsx     celá aplikace: setup / quiz / results
  routes/__root.tsx    HTML shell, meta tagy, načtení fontů
  styles.css           design systém (tokeny brand/success/danger, fonty)
```

### Doménový model (`src/lib/nasobilka.ts`)

```ts
type Mode = "choice" | "typing";
type Operation = "mul" | "div";

interface Problem {
  id: string;        // uuid
  a: number; b: number;   // základní činitelé
  op: Operation;
  left: number; right: number;  // zobrazené operandy
  answer: number;    // správný výsledek
  options: number[]; // 5 návrhů (obsahuje answer), zamíchané
}

interface Attempt { problem: Problem; given: number | null; correct: boolean }
```

Funkce:

- `createProblem({ operations, maxFactor })` – náhodný příklad.
  - Násobení: `a × b`, výsledek `a*b`.
  - Dělení: vygeneruje se `a × b`, zobrazí se `(a*b) ÷ b`, výsledek `a` → dělení vždy beze zbytku.
- `buildOptions()` – 5 unikátních kladných celých čísel včetně správného výsledku; distraktory
  vznikají typickými chybami (sousední násobek, záměna činitele, ±1…±10).
- `createTest(opts, count = 20)` – sada 20 příkladů; duplicity (stejná dvojice operandů a operace)
  se odfiltrují, po 40× count pokusech se doplní bez kontroly (pojistka proti nekonečné smyčce).
- `repeatWrong(attempts)` – nové instance chybných příkladů (nové `id`, znovu zamíchané možnosti),
  v náhodném pořadí.
- `formatProblem(p)` – textová podoba `„7 × 8“` / `„56 ÷ 7“`.
- `QUESTIONS_PER_TEST = 20`, `OPTION_COUNT = 5` – konstanty pro případnou změnu délky testu.

### Stavový automat UI (`src/routes/index.tsx`)

```
setup ──startTest()──▶ quiz ──poslední odpověď──▶ results
  ▲                     │                          │
  └──── onHome() ◀──────┴─ startRepeat()/startTest()┘
```

Klíčový stav: `phase`, `mode`, `operations`, `maxFactor`, `problems`, `index`, `attempts`,
`round`, `typed`, `feedback`.

`submit(value)`:
1. ignoruje volání, když už běží zpětná vazba (`feedback !== null`) – ochrana proti dvojkliku;
2. zapíše `Attempt`;
3. nastaví `feedback` (zobrazí správný výsledek, obarví tlačítka);
4. po 650 ms (správně) / 1400 ms (chyba) přejde na další příklad, nebo na `results`.

Opakování chyb: `startRepeat()` nastaví `problems = repeatWrong(attempts)`, vynuluje `attempts`
a zvýší `round` (v hlavičce se zobrazí „Opakování N“). Cyklus lze opakovat, dokud existují chyby.

Klávesnice: `useEffect` s posluchačem `keydown` je aktivní pouze ve fázi `quiz` a režimu `typing`.

### Design systém

Tokeny v `src/styles.css`: `--brand` (modrá #2563eb), `--accent` (žlutá #f59e0b),
`--success`, `--danger` a jejich `-soft`/`-foreground` varianty, `--font-display`
(Space Grotesk – čísla) a `--font-body` (Inter). V komponentách se používají výhradně
sémantické třídy (`bg-brand`, `text-danger`, `border-foreground`), nikoli pevné barvy.

Zásady čitelnosti: čísla min. ~48 px v příkladu, tlačítka odpovědí ≥ 72 px vysoká,
vysoký kontrast, 2px obrysy.

### Možná rozšíření

- Uložení historie výsledků (Lovable Cloud / databáze) a profily žáků.
- Volba konkrétní řady (např. jen „× 7“), časomíra, zvuková zpětná vazba.
- Tisk chybníku pro učitele.
