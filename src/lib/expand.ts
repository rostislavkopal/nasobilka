import type { Settings } from "./core";

/** Vybrané hodnoty skupiny voleb; „both“ (nebo nic) znamená všechny možnosti. */
export function expand(s: Settings, id: string, all: string[]): string[] {
  const v = (s[id] ?? []).filter((x) => x === "both" || all.includes(x));
  if (v.length === 0 || v.includes("both")) return all;
  return v;
}
