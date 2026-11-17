import { Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export type Option = { v: string; l: string; sub?: string };

/**
 * Panneau qui monte du bas de l'écran pour choisir une valeur dans une liste
 * (niveau, matière, type, année). Se ferme en glissant vers le bas ou en touchant à côté.
 * `allLabel` ajoute une première ligne « Tous… » qui renvoie la valeur vide.
 */
export function OptionSheet({
  open,
  onOpenChange,
  title,
  hint,
  options,
  value,
  onSelect,
  allLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hint?: string;
  options: Option[];
  value: string | undefined;
  onSelect: (v: string) => void;
  allLabel?: string;
}) {
  const rows: Option[] = allLabel ? [{ v: "", l: allLabel }, ...options] : options;
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-0 bg-card pb-safe">
        <DrawerHeader className="px-5 pb-2 pt-4 text-left">
          <DrawerTitle className="text-lg font-bold">{title}</DrawerTitle>
          <DrawerDescription className={hint ? "text-sm" : "sr-only"}>
            {hint ?? `Choisir : ${title}`}
          </DrawerDescription>
        </DrawerHeader>
        <ul className="max-h-[60dvh] overflow-y-auto px-2 pb-4">
          {rows.map((o) => {
            const selected = (value ?? "") === o.v;
            return (
              <li key={o.v || "all"}>
                <button
                  aria-pressed={selected}
                  onClick={() => onSelect(o.v)}
                  className={`press-row flex min-h-13 w-full items-center gap-3 rounded-xl px-3 text-left text-base ${selected ? "font-bold text-primary" : "font-medium"}`}
                >
                  <span className="min-w-0 flex-1">
                    {o.l}
                    {o.sub && (
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        {o.sub}
                      </span>
                    )}
                  </span>
                  {selected && <Check className="h-5 w-5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
