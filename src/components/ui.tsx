import {
  ArrowLeft, BookOpen, Calculator, ChartNoAxesColumnIncreasing, GraduationCap, LayoutGrid, Plus, Ruler,
  Star, Workflow, type LucideIcon,
} from "lucide-react";
import type { TopicId } from "../lib/core";
import { Logo } from "./Art";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Vizuál témat. Třídy jsou celé řetězce, aby je Tailwind našel při buildu. */
export const TOPIC_STYLE: Record<
  TopicId,
  { icon: LucideIcon; icoBox: string; text: string; soft: string; btn: string; hoverCard: string }
> = {
  muldiv: {
    icon: Calculator, icoBox: "bg-t-cyan-soft text-t-cyan", text: "text-t-cyan", soft: "bg-t-cyan-soft",
    btn: "bg-t-cyan-soft text-t-cyan group-hover:bg-t-cyan-mid", hoverCard: "hover:border-t-cyan/60 hover:shadow-[0_24px_60px_-24px_var(--t-cyan)] focus-visible:border-t-cyan",
  },
  addsub: {
    icon: Plus, icoBox: "bg-t-orange-soft text-t-orange", text: "text-t-orange", soft: "bg-t-orange-soft",
    btn: "bg-t-orange-soft text-t-orange group-hover:bg-t-orange-mid", hoverCard: "hover:border-t-orange/60 hover:shadow-[0_24px_60px_-24px_var(--t-orange)] focus-visible:border-t-orange",
  },
  order: {
    icon: Workflow, icoBox: "bg-t-violet-soft text-t-violet", text: "text-t-violet", soft: "bg-t-violet-soft",
    btn: "bg-t-violet-soft text-t-violet group-hover:bg-t-violet-mid", hoverCard: "hover:border-t-violet/60 hover:shadow-[0_24px_60px_-24px_var(--t-violet)] focus-visible:border-t-violet",
  },
  units: {
    icon: Ruler, icoBox: "bg-t-gold-soft text-t-gold", text: "text-t-gold", soft: "bg-t-gold-soft",
    btn: "bg-t-gold-soft text-t-gold group-hover:bg-t-gold-mid", hoverCard: "hover:border-t-gold/60 hover:shadow-[0_24px_60px_-24px_var(--t-gold)] focus-visible:border-t-gold",
  },
  word: {
    icon: BookOpen, icoBox: "bg-t-pink-soft text-t-pink", text: "text-t-pink", soft: "bg-t-pink-soft",
    btn: "bg-t-pink-soft text-t-pink group-hover:bg-t-pink-mid", hoverCard: "hover:border-t-pink/60 hover:shadow-[0_24px_60px_-24px_var(--t-pink)] focus-visible:border-t-pink",
  },
};

export function TopicIcon({ id, size = "size-12" }: { id: TopicId; size?: string }) {
  const st = TOPIC_STYLE[id];
  const Icon = st.icon;
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-2xl ring-1 ring-white/10", size, st.icoBox)}>
      <Icon className="size-1/2" strokeWidth={2} />
    </span>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("glass rounded-3xl", className)}>{children}</div>;
}

/** Volba v nastavení: šedá dlaždice, vybraná = mátová se zeleným rámečkem. */
export function OptionButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex min-h-11 items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-bold transition sm:text-base",
        active
          ? "border-brand bg-brand-soft text-foreground shadow-[0_0_24px_-8px_var(--brand)]"
          : "border-transparent bg-muted text-foreground/85 hover:border-brand/40 hover:text-foreground",
      )}
    >
      {Icon && <Icon className="size-4.5" strokeWidth={2.25} />}
      {children}
    </button>
  );
}

export function BackLink({ onClick, children = "Zpátky na rozcestník" }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
      <ArrowLeft className="size-4" /> {children}
    </button>
  );
}

/** Pět hvězdiček; `filled` z nich je plných. */
export function StarRow({ filled, total = 5, size = "size-7", label }: { filled: number; total?: number; size?: string; label?: string }) {
  return (
    <div className="flex items-center gap-1" aria-label={label ?? `${filled} z ${total} hvězdiček`} role="img">
      {Array.from({ length: total }, (_, i) => (
        <Star
          key={i}
          className={cx(size, "transition-colors duration-300", i < filled ? "anim-star fill-star text-star" : "fill-muted text-star-empty")}
          strokeWidth={1.75}
        />
      ))}
    </div>
  );
}

export type Page = "practice" | "progress";

export function Header({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const item = (p: Page, Icon: LucideIcon, label: string) => (
    <button
      onClick={() => onNavigate(p)}
      aria-current={page === p ? "page" : undefined}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition sm:px-4",
        page === p ? "bg-brand-soft text-foreground" : "text-foreground/80 hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4.5" strokeWidth={2.25} />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <button onClick={() => onNavigate("practice")} className="flex items-center gap-3 text-left" aria-label="Na rozcestník">
          <Logo className="size-11 shrink-0" />
          <span>
            <span className="block text-lg font-extrabold leading-tight sm:text-xl">
              Matematika <span className="text-gradient">hrou</span>
            </span>
            <span className="block text-xs text-muted-foreground sm:text-sm">Malé kroky, velké objevy.</span>
          </span>
        </button>
        <nav className="flex items-center gap-1 sm:gap-2">
          {item("practice", LayoutGrid, "Procvičování")}
          {item("progress", ChartNoAxesColumnIncreasing, "Můj pokrok")}
          <span className="ml-2 hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-bold md:inline-flex">
            <GraduationCap className="size-4.5" /> 3. třída ZŠ
          </span>
        </nav>
      </div>
    </header>
  );
}
