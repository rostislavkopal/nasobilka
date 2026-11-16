/* Ilustrace zvířat (WebP s průhledností, zmenšené z originálů) a logo. */
import kozaZepredu from "../assets/koza-zepredu.webp";
import kozaProfil from "../assets/koza-profil.webp";
import krava from "../assets/krava.webp";
import { cx } from "./ui";

const ART = {
  goat: { src: kozaZepredu, w: 900, h: 1252, alt: "Barevná koza" },
  goatSide: { src: kozaProfil, w: 740, h: 752, alt: "Barevná koza z profilu" },
  cow: { src: krava, w: 800, h: 913, alt: "Barevná kráva" },
} as const;

export type ArtKind = keyof typeof ART;

/** Maskot se svitem; `eager` pro obrázek viditelný hned po načtení (rozcestník). */
export function Mascot({ kind, className, eager }: { kind: ArtKind; className?: string; eager?: boolean }) {
  const a = ART[kind];
  return (
    <img
      src={a.src}
      width={a.w}
      height={a.h}
      alt={a.alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cx("glow-art pointer-events-none h-auto select-none", className)}
    />
  );
}

/** Logo: čtverec s neonovým přechodem a znaménky + − × ÷. */
export function Logo({ className = "size-11" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4fd8" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-g)" />
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round">
        <path d="M14 21h14M21 14v14" />
        <path d="M36 21h14" />
        <path d="M16 38l10 10M26 38L16 48" />
        <path d="M36 43h14" />
      </g>
      <circle cx="43" cy="36.5" r="2.8" fill="#fff" />
      <circle cx="43" cy="49.5" r="2.8" fill="#fff" />
    </svg>
  );
}
